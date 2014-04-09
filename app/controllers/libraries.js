'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    scan = require('../lib/scan.js'),
    util = require('../../util.js');

/**
 * Find library by id
 */
exports.library = function(req, res, next, id) {
  req.db.libraries.findOne({_id: id}, function(err, library) {
    if (err) return next(err);
    if (!library) return next(new Error('Failed to load library ' + id));
    req.library = library;
    next();
  });
};

/**
 * Update an library
 */
exports.update = function(req, res) {
  var library = req.library;
  var id = library._id;

  var diff = util.diffDeep(library, req.body);
  console.log(diff);
  library = _.extend(library, req.body);

  req.db.libraries.update({_id: id}, {$set: diff}, function(err, num) {
    if (err) {
      return res.send(500, {msg: err});
    } else {
      console.log('num: '+ num);
      res.json(library);
    }
  });
};

/**
 * Delete an library
 */
exports.destroy = function(req, res) {
  var libraryId = req.library._id;

  req.db.libraries.remove({_id: libraryId}, function(err, num) {
    if (err) {
      return res.json(500, {
        errors: err.errors
      });
    }
    req.db.songs.remove({library: libraryId}, {multi: true}, function(err) {
      if (err) {
        console.log(err);
      }
      res.jsonp(num);
    });
  });
};

/**
 * Show an library
 */
exports.show = function(req, res) {
  if (!req.library) {
    return res.jsonp(404, {msg: 'Library not found'});
  }
  res.jsonp(req.library);
};

var fetchSortQuery = function(req) {
  var sort = {display_artist: 1, album: 1, track: {no: 1}};
  if (req.param('sort')) {
    sort = req.param('sort');
    var newSort = {};
    if (sort instanceof Array) {
      for (var i in sort) {
        if (sort[i] === 'track' || sort[i] === 'disk') {
          if (!sort.hasOwnProperty('album')) {
            newSort.album = 1;
          }
          newSort[sort[i] + '.no'] = 1;
        } else if (typeof sort[i] === 'string') {
          if (sort[i] === 'artist') {
            newSort.artist = 1;
          } else {
            newSort[sort[i]] = 1;
          }
        }
      }
    } else if (typeof sort === 'string') {
      newSort[sort] = 1;
    }
    sort = newSort;
  }
  return sort;
};

var fetchCriteriaQuery = function(req) {
  if (!req.param('q')) {
    return {};
  }
  var criteria = JSON.parse(req.param('q'));

  return criteria;
};

/**
 * List of Songs
 */
exports.all = function(req, res) {
  var criteria = fetchCriteriaQuery(req);
  console.log(require('util').inspect(criteria));
  var limit = parseInt(req.param('limit'), 10) || 10;
  var page = parseInt(req.param('page'),10) || 1;
  var skip = (page-1) * limit;
  var sort = fetchSortQuery(req);
  console.log(sort);
  req.db.libraries.find(criteria).skip(skip).limit(limit).sort(sort).exec(function(err, libraries) {
    if (err) {
      res.json(500, {error: err});
    } else {
      res.jsonp(libraries);
    }
  });
};

/**
 * Count Songs
 */
exports.count = function(req, res) {
  req.db.libraries.count({}, function(err, count) {
    if (err) {
      res.json(500, {error: err});
    } else {
      res.json({count: count});
    }
  });
};

exports.checkDirectory = function(req, app) {
  req.io.join('scanners');
  console.log(req.data);

  if (!req.data.path) {
    return app.io.room('scanners').broadcast('error', {msg: 'The parameter "path" is required !'});
  }
  var path = require('path'),
      fs = require('fs');

  var collectionPath = path.normalize(req.data.path);
  console.log('before: ' + collectionPath);
  if (collectionPath.substr(-1,1) === '/') {
    collectionPath = collectionPath.substr(0, collectionPath.length-1);
  }
  console.log('after: ' + collectionPath);
  if (!fs.existsSync(collectionPath)) {
    return app.io.room('scanners').broadcast('error', {msg: 'path (' + collectionPath + ') does not exists !'});
  }
  scan.check(app, collectionPath);
};

exports.stopScan = function(req, app) {
  req.io.join('scanners');
  console.log(req.data);

  if (req.data.stop) {
    scan.stop(app);
  }
};

/**
 * Scan la bibliothèque
 */
exports.scan = function(req, app) {
  req.io.join('scanners');
  console.log(req.data);

  if (!req.data.name || req.data.name === '') {
    return req.io.room('scanners').broadcast('error', {msg: 'The parameter "name" is required !'});
  }
  var libraryName = req.data.name;
  scan.loadFiles(app, libraryName);
};

/**
 * Ajoute des fichiers à la bibliothèque
 */
exports.addFiles = function(req, app) {
  console.log('add');
  req.io.join('scanners');
  console.log(req.data);

  if (!req.data.path) {
    return req.io.room('scanners').broadcast('error', {msg: 'The parameter "path" is required !'});
  }
  if (!req.data.id) {
    return req.io.room('scanners').broadcast('error', {msg: 'The parameter "id" is required !'});
  }
  var libraryId = req.data.id;
  console.log('libraryId: ' + libraryId);

  var path = require('path'),
    fs = require('fs');

  var collectionPath = path.normalize(req.data.path);
  console.log('before: ' + collectionPath);
  if (collectionPath.substr(-1,1) === '/') {
    collectionPath = collectionPath.substr(0, collectionPath.length-1);
  }
  console.log('after: ' + collectionPath);
  var exists = fs.existsSync(collectionPath);
  if (!exists) {
    return app.io.room('scanners').broadcast('error', {msg: 'path (' + collectionPath + ') does not exists !'});
  }
  app.db.libraries.findOne({_id: libraryId}, function(err, doc) {
    if (err) {
      console.log(err);
      return app.io.room('scanners').broadcast('error', {msg: err});
    }
    if (null === doc) {
      console.log('library not found');
      return app.io.room('scanners').broadcast('error', {msg: 'Library (' + req.data.id + ') does not exists !'});
    }
    console.log(doc);
    scan.addFiles(app, collectionPath, doc);
  });
};


/* vim: set ts=2 sw=2 et ai: */