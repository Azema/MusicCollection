'use strict';

var config = require('./config'),
    Datastore = require('nedb');

module.exports = function(app) {
  var db = {};
  console.log('DB songs: ' + config.db.songs);
  db.songs = new Datastore({ filename: config.db.songs });
  db.songs.ensureIndex({ fieldName: 'title' }, function (err) {
    // If there was an error, err is not null
    if (err) {
      console.log(err);
    }
  });
  db.songs.ensureIndex({ fieldName: 'album' }, function (err) {
    // If there was an error, err is not null
    if (err) {
      console.log(err);
    }
  });
  db.songs.ensureIndex({ fieldName: 'artist' }, function (err) {
    // If there was an error, err is not null
    if (err) {
      console.log(err);
    }
  });
  db.songs.ensureIndex({ fieldName: 'track.no' }, function (err) {
    // If there was an error, err is not null
    if (err) {
      console.log(err);
    }
  });
  db.libraries = new Datastore({ filename: config.db.libraries });

  db.songs.loadDatabase(function(err) {
    if (err) {
      console.log('Erreur DB songs: ' + err);
    }
  });
  db.libraries.loadDatabase(function(err) {
    if (err) {
      console.log('Erreur DB libraries: ' + err);
    }
  });
  app.use(function(req, res, next) {
    app.db = req.db = db;
    next();
  });
};

/* vim: set ts=2 sw=2 et ai: */