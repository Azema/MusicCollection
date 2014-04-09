'use strict';

// Discogs routes use discogs controller
var discogs = require('../controllers/discogs'),
    querystring = require('querystring');

function require_login(req, res, next) {
  if(!req.session.oauth_access_token) {
    res.json(403, {auth: 'http://localhost:3000/discogs/auth'/*?action=' + querystring.escape(req.originalUrl)*/});
    return;
  }
  next();
}

module.exports = function(app) {
  app.get('/discogs/auth', discogs.auth);
  app.get('/discogs/cb', discogs.cb);
  app.get('/database/search', require_login, discogs.findOnDiscogs);
};

/* vim: set ts=2 sw=2 et ai: */
