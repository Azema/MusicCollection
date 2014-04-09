/**
 * Created by manuel on 29/03/14.
 */
'use strict';

angular.module('musicCollection.filters')
  .filter('normalize', function() {
    return function(input) {
      if (!input || input === '' || input === undefined) {
        return '';
      }
      // Différents caractères accentués. Ne pas les ajouter à la règle.
      // Elle sert pour réaliser les noms des classes CSS.
      // àâäåçéèêëïîöôùüûýÿŷÀÂÄÅÇÉÈÊËÏÎÖÔÙÜÛÝŶŸæÛÎÔ©®¿¡²

      return input.replace(new RegExp('[^a-zA-Z0-9_-]', 'g'), '');
    };
  });