'use strict';

var path = require('path'),
    rootPath = path.normalize(path.join(__dirname, '../..'));

module.exports = {
  db: {
    songs: rootPath + '/dbs/songs.db',
    libraries: rootPath + '/dbs/libraries.db'
  },
  app: {
    name: 'Music Server - Development'
  }
};

/* vim: set ts=2 sw=2 et ai: */
