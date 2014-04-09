'use strict';

/**
 * Module dependencies.
 */
var express = require('express.io'),
    fs = require('fs'),
    util = require('./util.js');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Load configurations
// Set the node environment variable if not set before
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Initializing system variables 
var config = require('./config/config');
// make sure the dbs directory is present                                                                             
util.mkdir(__dirname + '/dbs', function(){
  // make sure the cover directory is present
  util.mkdir(__dirname + '/dbs/covers', function(){});
});

// Bootstrap passport config
//require('./config/passport')(passport);

var app = express();
app.http().io();

require('./config/db')(app);
app.set('root_path', __dirname);

// Express settings
require('./config/express')(app);

// Bootstrap routes
var routes_path = __dirname + '/app/routes';
var walk = function(path) {
  fs.readdirSync(path).forEach(function(file) {
    var newPath = path + '/' + file;
    var stat = fs.statSync(newPath);
    if (stat.isFile()) {
      if (/(.*)\.(js$|coffee$)/.test(file)) {
        require(newPath)(app);
      }
      // We skip the app/routes/middlewares directory as it is meant to be
      // used and shared by routes as further middlewares and is not a 
      // route by itself
    } else if (stat.isDirectory() && file !== 'middlewares') {
      walk(newPath);
    }
  });
};
walk(routes_path);

// Start the app by listening on <port>
var port = process.env.PORT || config.port;
app.listen(port);
console.log('Express app started on port ' + port);

// Expose app
module.exports = app;

/* vim: set ts=2 sw=2 et ai: */
