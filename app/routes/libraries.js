/**
 * Created by manuel on 31/03/14.
 */
'use strict';

// Songs routes use libraries controller
var libraries = require('../controllers/libraries');

module.exports = function(app) {
  app.get('/libraries', libraries.all);
  app.get('/libraries/count', libraries.count);
  app.get('/libraries/:libraryId', libraries.show);
  app.put('/libraries/:libraryId', libraries.update);
  app.del('/libraries/:libraryId', libraries.destroy);
  app.io.route('check_directory', function(req) { libraries.checkDirectory(req, app); });
  app.io.route('stop_scan', function(req) { libraries.stopScan(req, app); });
  app.io.route('scan_library', function(req) { libraries.scan(req, app); });
  app.io.route('add_library', function(req) { libraries.addFiles(req, app); });

  // Finish with setting up the libraryId param
  app.param('libraryId', libraries.library);
};

/* vim: set ts=2 sw=2 et ai: */