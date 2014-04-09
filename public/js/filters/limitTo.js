/**
 * Created by manuel on 29/03/14.
 */
'use strict';

angular.module('musicCollection.filters')
  .filter('mcLimitTo', function() {
    return function(input, sizeMax) {
      if (!input || input === '' || input === undefined) {
        return '';
      } else if (input.length <= sizeMax) {
        return input;
      }
      return input.substr(0, sizeMax) + '...';
    };
  });