'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
  root: rootPath,
  port: process.env.PORT || 3000,
  templateEngine: 'swig',

  // The secret should be set to a non-guessable string that
  // is used to compute a session hash
  sessionSecret: 'MEAN',
  // The name of the MongoDB collection to store sessions in
  sessionCollection: 'sessions',
  coversDirectory: rootPath + '/dbs/covers',
  db: {
    songs: rootPath + '/dbs/songs.db',
    libraries: rootPath + '/dbs/libraries.db'
  },
  app: {
    name: 'Music Server'
  },
  discogs: {
    consumer: {
      key: 'Your consumer key of Discogs',
      secret: 'Your consumer secret of Discogs'
    }
  }
};

/* vim: set ts=2 sw=2 et ai: */
