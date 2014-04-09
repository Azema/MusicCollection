'use strict';

/**
 * Module dependencies.
 */
var util = require('util'),
    config = require('../../config/config'),
    fs = require('fs'),
    OAuth = require('oauth').OAuth,
    querystring = require('querystring');

exports.auth = function(req, res) {
  var oa = new OAuth(
    'http://api.discogs.com/oauth/request_token',
    'http://api.discogs.com/oauth/access_token',
    'nRlVlEgtKFSiYpBwSXXb', // your application consumer key
    'zBrdDqBxFeFujJeFDImFsFklmJeTysuO', // your application secret
    '1.0A',
    'http://localhost:3000/discogs/cb' + ( req.param('action') && req.param('action') !== '' ? '?action=' + querystring.escape(req.param('action')) : '' ),
    'HMAC-SHA1'
  );
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if (error) util.puts('error :' + error);
    else {
      util.puts('oauth_token :' + oauth_token);
      util.puts('oauth_token_secret :' + oauth_token_secret);
      util.puts('requestoken results :' + util.inspect(results));
      util.puts('Requesting access token');
      // store the tokens in the session
      req.session.oa = oa;
      req.session.oauth_token = oauth_token;
      req.session.oauth_token_secret = oauth_token_secret;

      // Redirect the user to authorize page
      res.redirect('http://www.discogs.com/oauth/authorize?oauth_token=' + oauth_token);
    }
  });
};

// Callback for the authorization page
exports.cb = function(req, res) {

  // get the OAuth access token with the 'oauth_verifier' that we received

  var oa = new OAuth(req.session.oa._requestUrl,
                    req.session.oa._accessUrl,
                    req.session.oa._consumerKey,
                    req.session.oa._consumerSecret,
                    req.session.oa._version,
                    req.session.oa._authorize_callback,
                    req.session.oa._signatureMethod);

  console.log(oa);

  oa.getOAuthAccessToken(
    req.session.oauth_token,
    req.session.oauth_token_secret,
    req.param('oauth_verifier'),
    function(error, oauth_access_token, oauth_access_token_secret, results2) {

      if (error) {
        console.log('error');
        console.log(error);
      } else {
        // store the access token in the session
        req.session.oauth_access_token = oauth_access_token;
        req.session.oauth_access_token_secret = oauth_access_token_secret;

        res.redirect((req.param('action') && req.param('action') !== '') ? req.param('action') : '/');
      }
    }
  );
};

exports.findOnDiscogs = function(req, res) {
  console.log(req.url);
  var oa = new OAuth(req.session.oa._requestUrl,
                    req.session.oa._accessUrl,
                    req.session.oa._consumerKey,
                    req.session.oa._consumerSecret,
                    req.session.oa._version,
                    req.session.oa._authorize_callback,
                    req.session.oa._signatureMethod);
  oa._headers['User-Agent'] = 'MusicCollection/0.0.1';
  oa._headers['Content-Type'] = 'application/json';
  oa.getProtectedResource('http://api.discogs.com' + req.url, 'GET', req.session.oauth_access_token, req.session.oauth_access_token_secret,  function (error, data, response) {
    console.log(error, data);
    if (error && response.status_code !== 403) {
      res.json(500, {error: error.message});
    } else if (response.status_code === 403) {
      res.json(403, {auth: 'http://localhost:3000/discogs/auth'});
    } else {
      res.json(200, JSON.parse(data));
    }
  });
};

/* vim: set ts=2 sw=2 et ai: */
