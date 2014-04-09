'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    util = require('../../util.js'),
    config = require('../../config/config'),
    fs = require('fs');

/**
 * Gère les critères de tri
 *
 * @param {Object} req - La requête
 * @returns {Object}
 */
var fetchSortQuery = function(req) {
  var sort = {artist: 1, album: 1, track: 1};
  if (req.param('sort')) {
    sort = req.param('sort');
    var newSort = {};
    if (sort instanceof Array) {
      for (var i in sort) {
        if (sort[i] === 'track' || sort[i] === 'disk') {
          if (!sort.hasOwnProperty('album')) {
            newSort.album = 1;
          }
          newSort[sort[i]] = 1;
        } else if (typeof sort[i] === 'string') {
          newSort[sort[i]] = 1;
        }
      }
    } else if (typeof sort === 'string') {
      newSort[sort] = 1;
    }
    sort = newSort;
  }
  return sort;
};
/**
 * Recherche des expressions régulières dans les critères de recherche
 *
 * @param {Object} data - Les données à vérifier
 * @returns {*}
 */
var searchRegexOnQuery = function(data) {
  for (var i in data) {
    if (i === '$regex') {
      data[i] = new RegExp(RegExp.escape(data[i]), 'i');
    } else if (typeof data[i] === 'object') {
      data[i] = searchRegexOnQuery(data[i]);
    }
  }
  return data;
};
/**
 * Analyse les critères de recherche
 *
 * @param {Object} req      - La requête
 * @param {Object} defaults - Les critères par défaut
 * @returns {*}
 */
var fetchCriteriaQuery = function(req, defaults) {
  RegExp.escape = function(string) {
    return string.replace(/[\/\\()|[\]{}]/g, '\\$&');
  };
  defaults = defaults || {};
  if (!req.param('q')) {
    return defaults;
  }
  var criteria = JSON.parse(req.param('q'));
  criteria = searchRegexOnQuery(criteria);

  return criteria;
};

/**
 * Find song by id
 */
exports.song = function(req, res, next, id) {
  req.db.songs.findOne({_id: id}, function(err, song) {
    if (err) return next(err);
    if (!song) return next(new Error('Failed to load song ' + id));
    req.song = song;
    next();
  });
};

/**
 * Update an song
 */
exports.update = function(req, res) {
  var song = req.song;
  var id = song._id;
  if (req.body.hasOwnProperty('track')) {
    req.body.track = parseInt(req.body.track, 10);
  }
  //console.log(req.body, song);

  var diff = util.diffDeep(song, req.body);
  console.log(diff);
  song = _.extend(song, req.body);

  req.db.songs.update({_id: id}, {$set: diff}, function(err, num) {
    if (err) {
      if (typeof err === 'object') {
        err = err.toString();
      }
      return res.send(err);
    } else if (num > 0) {
      console.log('num: '+ num);
      res.jsonp(song);
    }
  });
};
/**
 * Met à jour plusieurs enregistrements de chansons
 *
 * @param {Object} req - La requête
 * @param {Object} res - La réponse
 * @returns {*}
 */
exports.updateMulti = function(req, res) {
  var criteria = fetchCriteriaQuery(req, {});
  if ({} === criteria) {
    return res.json(412, {msg: 'The parameter "q" is expected!'});
  }
  console.log('criteria:', criteria);
  console.log(req.body);
  var data = req.body;
  if (_.isEmpty(data)) {
    return res.json(412, {msg: 'Vous devez fournir des données à mettre à jour'});
  }
  console.log('data: ', data);

  req.db.songs.update(criteria, {$set: data}, {multi: true}, function(err, num) {
    if (err) {
      if (typeof err === 'object') {
        err = err.toString();
      }
      return res.send(err);
    } else if (num > 0) {
      console.log('num: '+ num);
      req.db.songs.find(criteria, function(err, songs) {
        if (err) {
          if (typeof err === 'object') {
            err = err.toString();
          }
          return res.send(err);
        }
        res.json(200, {results: songs});
      });
    }
  });
};

/**
 * Delete an song
 */
exports.destroy = function(req, res) {
  var song = req.song;

  song.remove(function(err) {
    if (err) {
      return res.send('users/signup', {
        errors: err.errors,
        song: song
      });
    } else {
      res.jsonp(song);
    }
  });
};

/**
 * Show an song
 */
exports.show = function(req, res) {
  res.jsonp(req.song);
};

/**
 * List of Songs
 */
exports.all = function(req, res) {
  var criteria = fetchCriteriaQuery(req);
  console.log(require('util').inspect(criteria));
  var limit = req.param('limit') ? parseInt(req.param('limit'), 10) : 10;
  var page = req.param('page') ? parseInt(req.param('page'), 10) : 1;
  var skip = (page-1) * limit;
  var sort = fetchSortQuery(req);
  console.log(sort);
  req.db.songs.find(criteria).skip(skip).limit(limit).sort(sort).exec(function(err, songs) {
    if (err) {
      res.json(500, {error: err});
    } else {
      res.jsonp(songs);
    }
  });
};

var pictureExists = function(pictureName) {
  return fs.existsSync(config.coversDirectory + '/' + pictureName);
};
var getPictureName = function(song) {
  var name = song.artist + song.album || '';
  return name.replace(/[^a-z0-9_-]/gi, '');
};

var getPicture = function(song) {
  var picture = {path: '/public/img/icons/interrogation.png', cwd: {root: __dirname + '/../../'}};
  var pictureName = getPictureName(song);
  console.log('pictureName: ' + pictureName);
  if (pictureName !== '' && pictureExists(pictureName)) {
    picture = {path: '/' + pictureName, cwd: {root: config.coversDirectory}};
  }
  return picture;
};

exports.sendCover = function(req, res) {
  req.db.songs.findOne({hash: req.param('hash')}, function(err, song) {
    if (!song) {
      res.sendfile('/public/img/icons/interrogation.png', {root: __dirname + '/../../'});
    } else {
      var picture = getPicture(song, true);
      res.sendfile(picture.path, picture.cwd);
    }
  });
};

/**
 * Count Songs
 */
exports.count = function(req, res) {
  var criteria = fetchCriteriaQuery(req);
  req.db.songs.count(criteria, function(err, count) {
    if (err) {
      res.json(500, {error: err});
    } else {
      res.json({count: count});
    }
  });
};

/**
 * Retourne les artistes
 *
 * @param {Object} req
 * @param {Object} res
 */
exports.artists = function(req, res) {
  var criteria = fetchCriteriaQuery(req);
  console.log(criteria);
  var limit = req.param('limit') ? parseInt(req.param('limit'), 10) : 10;
  var page = req.param('page') ? parseInt(req.param('page'), 10) : 1;
  var skip = (page-1) * limit;
  var sort = {artist: 1};
  var group = {
    key: {'artist': 1},
    reduce: function(curr, result) {
      if (!result.albums.hasOwnProperty(curr.album)) {
        var pictureName = getPictureName(curr);
        if (pictureExists(pictureName)) {
          result.albums[curr.album] = curr.hash;
        } else {
          result.albums[curr.album] = null;
        }
      }
    },
    initial: {
      albums: {}
    }
  };
  req.db.songs.find(criteria).group(group).sort(sort).skip(skip).limit(limit).exec(function(err, artists) {
    if (err) {
      res.json(500, err.toString());
    } else {
      res.json(200, {results: artists});
    }
  });
};

/**
 * Retourne les albums
 *
 * @param {Object} req
 * @param {Object} res
 */
exports.albums = function(req, res) {
  var criteria = fetchCriteriaQuery(req);
  console.log(criteria);
  var limit = req.param('limit') ? parseInt(req.param('limit'), 10) : 10;
  var page = req.param('page') ? parseInt(req.param('page'), 10) : 1;
  var skip = (page-1) * limit;
  var sort = {album: 1};
  var group = {
    key: {'album': 1},
    reduce: function(curr, result) {
      result.cover_location = curr.hash;
    },
    initial: {
    }
  };
  req.db.songs.find(criteria).group(group).sort(sort).skip(skip).limit(limit).exec(function(err, albums) {
    if (err) {
      res.json(500, err.toString());
    } else {
      res.json(200, {results: albums});
    }
  });
};

/**
 * Retourne les genres
 *
 * @param {Object} req
 * @param {Object} res
 */
exports.genres = function(req, res) {
  var criteria = fetchCriteriaQuery(req, {genre: {$nin: ['']}});
  console.log(criteria);
  var limit = req.param('limit') ? parseInt(req.param('limit'), 10) : 10;
  var sort = {genre: 1};
  var group = {
    key: {'genre': 1},
    reduce: function(curr, result) {
      if (curr.genre instanceof Array && curr.genre.length > 0) {
        result.genre = curr.genre[0];
      }
      return result;
    },
    initial: {}
  };
  req.db.songs.find(criteria).group(group).sort(sort).limit(limit).exec(function(err, genres) {
    if (err) {
      res.json(500, err.toString());
    } else {
      res.json(200, {results: genres});
    }
  });
};

/* vim: set ts=2 sw=2 et ai: */
