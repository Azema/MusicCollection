'use strict';

angular.module('musicCollection').factory('mySocket', ['socketFactory', function (socketFactory) {
  return socketFactory();
}]);

/* vim: set ts=2 sw=2 et ai: */
