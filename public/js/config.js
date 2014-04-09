'use strict';

//Setting up route
angular.module('musicCollection').config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
  function($stateProvider, $urlRouterProvider, $locationProvider) {
    //Setting HTML5 Location Mode
    $locationProvider.hashPrefix('!');
    // For unmatched routes:
    $urlRouterProvider.otherwise('/');

    // states for my app
    $stateProvider
    .state('all songs', {
      url: '/songs',
      templateUrl: 'views/songs/list.html'
    })
    .state('all libraries', {
      url: '/libraries',
      templateUrl: 'views/libraries/list.html'
    })
    .state('load songs', {
      url: '/libraries/load',
      templateUrl: 'views/libraries/load.html'
    })
    .state('add songs', {
      url: '/libraries/add/:libraryId',
      templateUrl: 'views/libraries/add.html'
    })
    .state('edit song', {
      url: '/songs/:songId/edit',
      templateUrl: 'views/songs/edit.html'
    })
    .state('song by library id', {
      url: '/songs/:libraryId',
      templateUrl: 'views/songs/list.html'
    })
    .state('artists', {
      url: '/artists/:libraryId',
      templateUrl: 'views/artists/list.html'
    })
    .state('view artist', {
      url: '/artists/:libraryId/:artist',
      templateUrl: 'views/artists/show.html'
    })
    .state('view album', {
      url: '/albums/:libraryId/:artist/:album',
      templateUrl: 'views/albums/show.html'
    })
    .state('home', {
      url: '/',
      templateUrl: 'views/index.html'
    });
  }
]);

/* vim: set ts=2 sw=2 et ai: */
