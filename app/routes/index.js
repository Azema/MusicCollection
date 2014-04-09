'use strict';

module.exports = function(app) {

  // Home route
  var index = require('../controllers/index');
  app.get('/', index.render);
};

/* vim: set ts=2 sw=2 et ai: */
