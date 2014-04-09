'use strict';

angular.element(document).ready(function() {
  //Fixing facebook bug with redirect
  if (window.location.hash === '#_=_') window.location.hash = '#!';

  //Then init the app
  angular.bootstrap(document, ['musicCollection']);
});

/* vim: set ts=2 sw=2 et ai: */
