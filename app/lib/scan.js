/**
 * Module de scan de collection musicale
 *
 * @author Manuel Hervo
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
    taglib = require('taglib'),
    config = require('../../config/config'),
    debug = require('debug')('scan'),
    nbTags = 0,         // Nombre de chansons traitées
    nbAdded = 0,        // Nombre de chansons ajoutées en BDD
    errors = [],        // Fichiers en erreur de récupération de metadata
    durationTotal = 0,  // Durée total de la collection
    pictures = [],      // Contient les albums dont l'image a été traitée
    app,                // Application Express
    running = false,    // En cours de scan
    timeout,            /** L'objet retourné par setImmediate @see findNextSong */
    listLength = 0,     // Le nombre de fichiers audio à traiter
    songList = [],      // Le tableau des fichiers audio trouvés
    audioExts = ['mp3', 'mp4', 'm4a', 'flac', 'ogg', 'wma', 'wmv'], // Les extensions audio gérés
    libraryId,          // L'identifiant (BDD) de la collection en cours de scan
    songPath,           // Chemin du répertoire en cours de scan
    start;              // Temps de départ du scan. Sert pour indiquer la durée du scan.

/**
 * Retourne un message via la socket pour indiquer l'avancement du scan
 *
 * @param {String} id      - L'identifiant de la room
 * @param {Object} message - Le message à envoyer
 */
var broadcast = function(id, message) {
  app.io.room('scanners').broadcast(id, message);
};

/**
 * Indique si l'extension du fichier passé en paramètre est considéré comme un fichier audio géré par l'application.
 *
 * @param {String} item - Le chemin d'accès au fichier
 * @returns {boolean}
 */
var isAudioFile = function(item) {
  return (audioExts.indexOf(path.extname(item).substr(1).toLowerCase()) > -1);
};

/**
 * Recherche le nom le plus long parmis les deux paramètres.
 * Gère le cas des tableaux en séparant les noms par un slash.
 *
 * @param {String|String[]} albumartist - Infos retournées par 'metadata'
 * @param {String|String[]} artist      - Infos retournées par 'metadata'
 * @returns {String}
 */
//var normaliseArtist = function(albumartist, artist) {
//  debug('normalizeArtist: ' + albumartist + ' - ' + artist);
//  if (typeof(albumartist) !== 'string') {
//    debug(JSON.stringify(albumartist));
//    if (albumartist.length === 0) {
//      albumartist = '';
//    } else {
//      albumartist = albumartist.join('/');
//    }
//  }
//  if (typeof(artist) !== 'string') {
//    debug(JSON.stringify(artist));
//    if (artist.length === 0) {
//      artist = '';
//    } else {
//      artist = artist.join('/');
//    }
//  }
//  artist = (artist.length > albumartist.length) ? artist : albumartist;
//  debug('Artist: ' + artist);
//  return artist;
//};
var imgTypes = ['cover.jpg', 'AlbumArtSmall.jpg', 'AlbumArt.jpg', 'Folder.jpg'];
var RegPicture = new RegExp('[^a-zA-Z0-9_-]', 'g');
var addPictureAlbum = function(song) {
  var name = song.artist + song.album;
  if (!name || name === '') {
    // Peut être une autre chance avec un aute fichier
    return;
  }
  var directory = path.dirname(song.location);
  var fingerPrint = crypto.createHash('md5').update(directory).digest('hex');
  var pictureName = name.replace(RegPicture, '');
  if (!fs.existsSync(config.coversDirectory + '/' + pictureName) && pictures.indexOf(fingerPrint) === -1) {
    for (var i=0; i < imgTypes.length; i++) {
      if (fs.existsSync(directory + '/' + imgTypes[i])) {
        debug('Picture found: ' + directory + '/' + imgTypes[i]);
        fs.createReadStream(directory + '/' + imgTypes[i])
          .pipe(fs.createWriteStream(config.coversDirectory + '/' + pictureName));
        break;
      }
    }
    pictures.push(fingerPrint);
  }
};

/**
 * Ajoute le fichier audio (tags ID3) dans la BDD, si il n'existe pas déjà.
 *
 * @param {String}   item      - Le chemin d'accès au fichier
 * @param {String}   libraryId - L'identifiant de la collection
 * @param {Function} cb        - La fonction de callback
 */
var addToBdd = function(item, libraryId, cb) {
  var fingerPrint = crypto.createHash('md5').update(item).digest('hex');

  app.db.songs.findOne({hash: fingerPrint, library: libraryId}, function(err, doc) {
    if (err) {
      return cb(err);
    }
    if (doc === null) {
      debug('doc not found: ' + item);

      taglib.read(item, function(err, tags, audioProperties) {
        if (err) {
          errors.push(item);
          return cb(err);
        }
        var duration = 0;
        if (audioProperties.length) {
          duration = audioProperties.length;
        }
        var song = {
          title   : tags.title,
          album   : tags.album,
          artist  : tags.artist,
          genre   : tags.genre,
          year    : tags.year,
          duration: duration,
          hash    : fingerPrint,
          location: item,
          track   : tags.track,
          bitrate : audioProperties.bitrate,
          library : libraryId
        };

        app.db.songs.insert(song, function (err, newDoc) {
          if (err) {
            debug('Error to insert song: ' + JSON.stringify(err));
            return cb(err);
          } else {
            nbAdded++;
            durationTotal += newDoc.duration;
            // Vérification de la présence d'une image d'album
            addPictureAlbum(newDoc);
            broadcast('update', {
              count    : listLength,
              completed: nbTags + 1,
              details  : 'Added: ' + newDoc.artist + ' - ' + newDoc.album + ' - ' + newDoc.title,
              errors: errors,
              added: nbAdded
            });
            debug('song added');
            cb(null);
          }
        });
      });
    } else {
      debug('doc found: ' + item);
      broadcast('update', {
        count: listLength,
        completed: nbTags+1,
        details: 'Already scanned: ' + item,
        errors: errors,
        added: nbAdded
      });
      cb(null);
    }
  });
};

/**
 * Formatte des millisecondes en temps humain
 *
 * @param {Number} mseconds - Le nombre de millisecondes à formatter
 * @returns {string}
 */
var prettyDuration = function(mseconds) {
  var i = 0, out = [], value;
  var times = [
    {text: 'msec', divider: 1000},
    {text: 'seconds', value: 0, divider: 60},
    {text: 'minutes', value: 0, divider: 60},
    {text: 'hours', value: 0, divider: 24},
    {text: 'days', value: 0, divider: 7},
    {text: 'weeks', value: 0, divider: 4},
    {text: 'months', value: 0, divier: 12},
    {text: 'years', value: 0, divider: 0}
  ];
  while (mseconds > times[i].divider && i < times.length) {
    value = Math.floor(mseconds % times[i].divider);
    mseconds /= times[i].divider;
    if (value > 0) {
      out.unshift(value + ' ' + times[i].text);
    }
    else if (i+1 < times.length && mseconds < times[i+1].divider) {
      out.unshift(Math.floor(mseconds * times[i].divider) + ' ' + times[i].text);
      mseconds = 0;
    }
    ++i;
  }
  if (mseconds > 0) {
    value = Math.floor(mseconds);
    if (value > 0) {
      out.unshift(value + ' ' + times[i].text);
    }
  }
  return out.join(' ');
};

var reinitialize = function() {
  // reset for next scan
  nbTags = 0;
  nbAdded = 0;
  errors = [];
  durationTotal = 0;
  running = false;
  timeout = null;
  listLength = 0;
  songList = [];
  libraryId = null;
  songPath = null;
};

/**
 * Itère sur le tableau des fichiers audio pour les ajouter dans à la collection
 *
 */
var findNextSong = function() {
  if (songList.length && running) {
    var item = songList.shift();
    debug('nbTags: ' + nbTags + ' - running: ' + running + ' - songList.length: ' + songList.length);
    addToBdd(item, libraryId, function(err) {
      if (err) {
        console.log({error: err, file: item});
      }
      nbTags++;
      timeout = setImmediate(findNextSong);
    });
  } else if (songList.length <= 0) {
    clearImmediate(timeout);
    debug('finished!');
    var time = (new Date().getTime() - start.getTime());
    broadcast('update', {
      count: nbTags,
      completed: nbTags,
      details: 'Finished!',
      library: libraryId,
      added: nbAdded,
      errors: errors,
      time: prettyDuration(time)
    });
    app.db.songs.persistence.compactDatafile();
    if (libraryId && running) {
      debug('libraryId: ' + libraryId + ' - nbSongs: ' + nbTags + ' - duration scan: ' + durationTotal);
      app.db.libraries.update(
        { _id: libraryId },
        { $inc: { nbSongs: nbTags, time: durationTotal }},
        { upsert: false, multi: false },
        function(err, nbUpdated) {
          if (err) {
            console.log(err);
            return;
          }
          if (nbUpdated === 1) {
            debug('Library updated successfully');
          }
          app.db.libraries.persistence.compactDatafile();
        }
      );
    }
    reinitialize();
  } else if (!running) {
    debug('scan stopped by user');
    // Suppression de la collection
    app.db.libraries.remove({_id: libraryId}, function(err, numL) {
      if (err) {
        console.log(err);
      }
      debug(numL + ' libraries removed');
      app.db.songs.remove({library: libraryId}, { multi: true }, function(err, numS) {
        if (err) {
          console.log(err);
        }
        debug(numS + ' songs removed');
        reinitialize();
        broadcast('stop', {msg: 'Scan stopped!'});
      });
    });
  }
};

/**
 * Enregistre la nouvelle collection en BDD
 *
 * @param {String}   libraryName - Le nom de la bibliothèque
 * @param {String}   libraryPath - Le chemin d'accès à la bibliothèque
 * @param {Function} cb          - La fonction de callback
 */
var saveLibrary = function(libraryName, libraryPath, cb) {
  libraryName = libraryName || 'default';
  debug('saveLibrary: ' + libraryName + ' - ' + libraryPath);

  app.db.libraries.find({}).sort({title: 1}).exec(function(err, libraries) {
    if (err) {
      console.log(err);
      return;
    }
    var suffix = '01',
        origName = libraryName;
    for (var i in libraries) {
      if (libraries[i].hasOwnProperty('title') && libraries[i].title === libraryName) {
        debug('Library\'s Name already exists: ' + libraries[i].title);
        var match = libraries[i].title.trim().match(/([0-9]+)$/);
        if (match && match.length > 1) {
          suffix = parseInt(match[1], 10) + 1;
          if (suffix < 10) {
            suffix = '0' + suffix;
          }
        }
        libraryName = origName + suffix.toString();
      }
    }
    debug('libraryName: ' + libraryName);
    var library = {
      title: libraryName,
      paths: [libraryPath],
      nbSongs: 0,
      time: 0
    };
    app.db.libraries.insert(library, function(err, newLibrary) {
      if (err) {
        console.log(err);
        return cb(err);
      }
      // La library à bien été créée
      cb(null, newLibrary);
    });
  });
};

/**
 * Parcours un répertoire de manière récursive à la recherche de fichiers audio
 *
 * @param {String}   dir  - Le répertoire à parcourir
 * @param {Function} done - La fonction de callback
 */
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (isAudioFile(file)) {
            results.push(file);
          }
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

exports.stop = function(appRef) {
  debug('stop');
  app = appRef;
  running = false;
};

exports.check = function(appRef, directoryPath) {
  debug('check: ' + directoryPath);
  app = appRef;

  if (running) {
    broadcast('check', {itemsLength: 0, msg: 'Scan in progress!'});
    debug('scan in progress');
    return;
  }

  reinitialize();

  start = new Date();
  walk(directoryPath, function(err, result) {
    if (err) {
      console.log(err);
      debug(err);
      return broadcast('error', {msg: err});
    }
    debug('Walk files on: ' + prettyDuration(new Date().getTime() - start.getTime()));
    debug('List length: ' + result.length);
    listLength = result.length;
    songList = result;
    songPath = directoryPath;
    broadcast('check', {path: directoryPath, itemsLength: listLength, msg: 'Ok pour le scan ?'});
  });
};

/**
 * Crée une nouvelle collection de fichiers audio
 *
 * @param {Object} appRef        - L'objet app du serveur Express
 * @param {String} libraryName   - Le nom de la collection à créer
 */
exports.loadFiles = function(appRef, libraryName) {
  debug('loadFiles: ' + libraryName);
  app = appRef;

  debug('List length: ' + listLength);
  if (listLength < 0) {
    broadcast('update', {
      count: 0,
      completed: 0,
      details: 'Finished!',
      errors: [],
      library: null,
      added: 0
    });
    listLength = 0;
    songList = [];
    return;
  }

  start = new Date();
  saveLibrary(libraryName, songPath, function(err, library) {
    running = true;
    libraryId = library._id;
    debug('libraryId: ' + library._id);
    findNextSong();
  });
};

/**
 * Ajoute de nouveau fichiers audio à une collection existante
 *
 * @param {Object} appRef        - L'objet app du serveur Express
 * @param {String} directoryPath - Le chemin du répertoire contenant les fichiers audio
 * @param {Object} library       - La resource library à laquelle il faut ajouter les fichiers
 */
exports.addFiles = function(appRef, directoryPath, library) {
  debug('addFiles: ' + directoryPath + ' - id: ' + library._id);
  console.log('addFiles: ' + directoryPath + ' - id: ' + library._id);
  app = appRef;

  start = new Date();
  walk(directoryPath, function(err, result) {
    if (err) {
      console.log(err);
      return broadcast('error', {msg: err});
    }
    debug('Walk files on: ' + prettyDuration(new Date().getTime() - start.getTime()));
    debug('List length: ' + result.length);
    // On ajoute le nouveau chemin dans la bibliothèque
    libraryId = library._id;
    listLength = result.length;
    songList = result;

    if (listLength > 0) {
      app.db.libraries.update({_id: libraryId}, { $push: { paths: directoryPath }}, function(err) {
        if (err) {
          console.log(err);
        }
        running = true;
        findNextSong();
      });
    } else {
      broadcast('update', {
        count    : 0,
        completed: 0,
        details  : 'Finished!',
        added    : 0
      });
      listLength = 0;
      songList = [];
      libraryId = '';
    }
  });
};


/* vim: set ts=2 sw=2 et ai: */
