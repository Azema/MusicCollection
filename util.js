// This file is a bunch of utility functions
'use strict';

var fs = require('fs');

var mkdir = function(dir, done) {
  fs.exists(dir, function(exists) {
    if (exists) {
      return done();
    }
    fs.mkdir(dir, '0777', function () {
      done();
    });
  });
};
exports.mkdir = mkdir;

/**
 * Retourne les différences entre deux objets
 *
 * @param {Object} old  - L'objet initial
 * @param {Object} data - Le nouvel objet
 * @returns {{}}
 */
var diffDeep = function(old, data) {
  var diff = {};
  // On itère sur les propriétés du nouvel objet
  for (var p in data) {
    // Si l'objet initiale contient la même propriété
    if (old.hasOwnProperty(p)) {
      // Si la propriété est un tableau
      if (data[p] instanceof Array) {
        // On itère dessus et on ajoute les différences trouvées
        for (var i in data[p]) {
          if (old[p].hasOwnProperty(i) && old[p][i] !== data[p][i]) {
            if (!diff.hasOwnProperty(p)) {
              diff[p] = [];
            }
            diff[p][i] = data[p][i];
          }
        }
      } else if (typeof(data[p]) === 'object') {
        for (var j in data[p]) {
          if (old[p].hasOwnProperty(j) && old[p][j] !== data[p][j]) {
            if (!diff.hasOwnProperty(p)) {
              diff[p] = {};
            }
            diff[p][j] = data[p][j];
          }
        }
      } else if (old[p] !== data[p]) {
        diff[p] = data[p];
      }
    } else {
      diff[p] = data[p];
    }
  }
  return diff;
};
exports.diffDeep = diffDeep;

/* vim: set ts=2 sw=2 et ai: */
