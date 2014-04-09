'use strict';

/**
 * Module des artistes
 *
 * Dépendances:
 *  - ngAnimate
 *  - animations.details
 *  - directives.covers
 */
angular.module('musicCollection.artists', [
  'ngAnimate',
  'animations.details',
  'directives.covers',
  'infinite-scroll',
  'fundoo.services'
])
/**
 * Controleur des chansons
 */
  .controller('ArtistsController', [
    '$scope',
    '$http',
    '$stateParams',
    '$location',
    'Songs',
    'Libraries',
    'createDialog',
    function ($scope, $http, $stateParams, $location, Songs, Libraries, createDialog) {

      $scope.criteria = null;
      $scope.artists = [];

      $scope.$watch('criteria', function(value) {
        if (value) {
          $scope.artists = [];
          $scope.find();
        }
      });

      /**
       * Fonction de recherche des chansons. Il existe plsuieurs possibilités de recherche:
       *  - Le mode par défaut, la recherche se fait sur les champs 'artist', 'album' & 'title'
       *  - Sinon, il est possible de spécifier un champ de recherche en particulier (un seul à la fois):
       *    * 'at:' permet de filtrer seulement sur les artistes
       *    * 'ti:' permet de filtrer seulement sur les titres des chansons
       *    * 'al:' permet de filtrer seulement sur les albums
       *
       * @event HeaderController#search
       *
       * @param {Event}  event - L'évènement de la recherche déclenché par le controller header.js
       * @param {String} value - La valeur de la requête
       */
      $scope.$on('search', function(event, value) {
        //console.log(event);
        event.preventDefault();
        //console.log('songs scope: ' + value);
        var q = {};
        if (value !== '' && value !== undefined) {
          var re = new RegExp(':', 'g');
          if (!re.test(value)) {
            q = { $or: [
              { artist: { $regex: value.trim() } },
              { album: { $regex: value.trim() } },
              { title: { $regex: value.trim() } }
            ]};
          } else {
            var addToQ = function(q, data) {
              var keys = Object.keys(q);
              if (keys.length > 0 && keys[0] !== '$or') {
                var newQ = {
                  $or: []
                };
                for (var i in q) {
                  newQ.$or.push(q[i]);
                }
                newQ.$or.push(data);
                q = newQ;
              } else if (keys.length <= 0) {
                q = data;
              }
              return q;
            };
            var data = [
              {key: 'artist', reg: 'at'},
              {key: 'title', reg: 'ti'},
              {key: 'album', reg: 'al'},
              {key: 'genre', reg: 'gr'}
            ];
            var result, val, obj;
            for (var i in data) {
              re = new RegExp(data[i].reg + ':([^:]*)');
              result = value.match(re);
              if (result && result.length > 1) {
                val = result[1].trim();
                console.log(val);
                if (val !== '') {
                  obj = {};
                  obj[data[i].key] = {$regex: val};
                  q = addToQ(q, obj);
                }
                console.log(q);
              }
            }
          }
        }
        $scope.criteria = q;
      });

      $scope.currentPage = 1; // Numéro de la page courant pour la pagination
      $scope.itemsPerPage = 50; // Nombre de chansons par page

      $scope.busy = false;
      $scope.addArtists = function() {
        console.log('addArtists');
        if ($scope.busy) return;
        $scope.currentPage++;
        $scope.find();
      };
      /**
       * Permet de récupérer et d'afficher les chansons
       */
      $scope.find = function() {
        if ($scope.busy) return;
        $scope.busy = true;

        var params = {
          page: $scope.currentPage,
          limit: $scope.itemsPerPage,
          q: {}
        };
        if ($stateParams.libraryId) {
          $scope.library = $stateParams.libraryId;
        }
        if ($scope.criteria && $scope.criteria !== '') {
          params.q = $scope.criteria;
        }
        if ($scope.library) {
          params.q.library = $scope.library;
        }
        var url = '/songs/artists';
        if (params.hasOwnProperty('q')) {
          params.q = JSON.stringify(params.q);
        }
        var parts = [];
        angular.forEach(params, function(value, key) {
          parts.push(key + '=' + encodeURIComponent(value));
        });
        url += '?' + parts.join('&');
        console.log(params);
        $http.get(url).success(function(data) {
          $scope.artists = $scope.artists.concat(data.results);
          $scope.busy = false;
        });
      };

      $scope.showArtist = function(artist) {
        console.log($location.path());
        $location.path('/artists/' + $scope.library + '/' + artist.artist);
      };

      /**
       * Permet de récupérer une chanson
       */
      $scope.findOne = function() {
        var params = {limit: 0};
        console.log($stateParams.libraryId);
        if ($stateParams.libraryId) {
          $scope.library = $stateParams.libraryId;
        }
        if ($stateParams.artist) {
          $scope.artist = decodeURIComponent($stateParams.artist);
        }
        if (!params.hasOwnProperty('q')) {
          params.q = {};
        }
        params.q.artist = $scope.artist;
        if ($scope.library) {
          params.q.library = $scope.library;
        }
        console.log(params);
        var url = '/songs/albums?limit=0&q=' + encodeURIComponent(JSON.stringify(params.q));
        $http.get(url).success(function(data) {
          $scope.albums = data.results;
        });
      };

      $scope.showAlbum = function(album) {
        $location.path('/albums/' + $scope.library + '/' + encodeURIComponent($scope.artist) + '/' + encodeURIComponent(album.album));
        //createDialog('views/albums/show.html', {
          //title: album.album,
          //backdrop: true,
          //controller: 'AlbumsController',
          //css: {
            //top: '100px',
            //margin: '0 auto'
          //}
        //}, {album: album, artist: $scope.artist});
      };
    }
  ]
);

/* vim: set ts=2 sw=2 et ai: */
