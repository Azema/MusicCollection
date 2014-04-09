'use strict';

//Songs service used for songs REST endpoint
angular.module('musicCollection.libraries').factory('Libraries', ['$resource', function($resource) {
  return $resource('libraries/:libraryId', {
    libraryId: '@_id'
  }, {
    update: {
      method: 'PUT'
    }
  });
}]);

/* vim: set ts=2 sw=2 et ai: */
