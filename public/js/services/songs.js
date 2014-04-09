'use strict';

//Songs service used for songs REST endpoint
angular.module('musicCollection.songs').factory('Songs', ['$resource', function($resource) {
  return $resource('songs/:songId', {
    songId: '@_id',
    libraryId: '@library'
  }, {
    update: {
      method: 'PUT'
    }
  });
}]);

/* vim: set ts=2 sw=2 et ai: */
