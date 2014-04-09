'use strict';

angular.module('musicCollection', [
  'ngCookies',
  'ngResource',
  'ui.bootstrap',
  'ui.router',
  'btford.socket-io',
  'musicCollection.system',
  'musicCollection.songs',
  'musicCollection.libraries',
  'musicCollection.artists',
  'musicCollection.albums',
  'musicCollection.filters',
  'musicCollection.services',
  'ui.bootstrap.progressbar',
  'ui.bootstrap.pagination'
])
  .run(['editableOptions', function(editableOptions) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
  }]);

angular.module('musicCollection.system', []);
angular.module('musicCollection.filters', []);
angular.module('musicCollection.services', []);
angular.module('musicCollection.songs', []);
angular.module('musicCollection.libraries', []);
angular.module('musicCollection.artists', []);
angular.module('musicCollection.albums', []);

/* vim: set ts=2 sw=2 et ai: */
