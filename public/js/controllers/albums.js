'use strict';

/**
 * Module des artistes
 *
 * Dépendances:
 *  - ngAnimate
 *  - animations.details
 *  - directives.covers
 */
angular.module('musicCollection.albums', [
  'ngAnimate',
  'xeditable',
  'fundoo.services'
])
/**
 * Controleur des chansons
 */
  .controller('AlbumsController', [
    '$scope',
    '$stateParams',
    '$q',
    '$http',
    '$location',
    '$window',
    'Songs',
    'createDialog',
    function($scope, $stateParams, $q, $http, $location, $window, Songs, createDialog) {

      /**
       * Permet de récupérer et d'afficher les chansons
       */
      $scope.find = function() {
        var params = {q: {}};
        if ($stateParams.libraryId) {
          $scope.library = $stateParams.libraryId;
        }
        if ($stateParams.artist) {
          $scope.artist = decodeURIComponent($stateParams.artist);
        }
        if ($stateParams.album) {
          $scope.album = decodeURIComponent($stateParams.album);
        }
        if ($scope.library) {
          params.q.library = $scope.library;
        }
        if ($scope.artist) {
          params.q.artist = $scope.artist;
        }
        if ($scope.album) {
          params.q.album = $scope.album;
        }
        if (params.hasOwnProperty('q')) {
          params.q = JSON.stringify(params.q);
        }
        console.log(params);
        Songs.query(params, function(data) {
          $scope.cover = data[0].hash;
          $scope.year = data[0].year;
          $scope.genre = data[0].genre;
          $scope.songs = data;
        });
      };

      $scope.findOnDiscogs = function() {
        var url = '/database/search?' +
          'artist=' + encodeURIComponent($scope.artist) +
          '&title=' + encodeURIComponent($scope.album) +
          '&format=cd&type=release&per_page=10';
        $http.get(url)
          .success(function(data) {
            console.log(data);
            createDialog('views/albums/discogs.html', {
              title: 'Results from Discogs',
              backdrop: true,
              controller: 'DiscogsController',
              css: {
                top: '100px',
                margin: '0 auto'
              }
            }, {album: $scope.album, artist: $scope.artist, releases: data.results, pagination: data.pagination});
          }).error(function(data, status) {
            if (status === 403) {
              $window.location.replace(data.auth + '?action=' + encodeURIComponent($location.absUrl()));
              //$window.open(data.auth);
            }
          });
      };

      /**
       * Permet de vérifier le format d'une année (YYYY),
       * retourne true lorsque c'est correct, sinon retourne un message d'erreur
       *
       * @param {string} data - L'année à vérifier
       * @returns {*}
       */
      $scope.checkYear = function(data) {
        var test = /^\d{4}$/.test(data);
        if (!test) {
          return 'Année incorrecte';
        }
        return true;
      };

      $scope.checkTrack = function(data) {
        if (!/^\d{1,}$/.test(data)) {
          return 'Piste incorrecte';
        }
        return true;
      };

      $scope.showArtist = function(artist) {
        $location.path('/artists/' + $scope.library + '/' + encodeURIComponent(artist));
      };

      /**
       * Permet de mettre à jour l'objet du scope (songDetails)
       *
       */
      $scope.updateSongs = function(data) {
        var promises = [];
        angular.forEach($scope.songs, function(song) {
          angular.forEach(data, function(value, key) {
            if (song.hasOwnProperty(key)) {
              song[key] = value;
            }
          });
          promises.push(song.$update());
        });
        return $q.all(promises);
      };

      /**
       * Récupère une liste de données à l'aide de l'URL fournit en paramètre et d'une clef de récupération.
       * Une valeur peut être fournit pour filtrer les données.
       *
       * @param {String} url   - L'URI d'accès aux données
       * @param {String} key   - La clef correspondant au type de donnée à récupérer (paramètre et résultats)
       * @param {String} value - La valeur servant de filtre
       *
       * @returns {*}
       */
      var getItems = function(url, key, value, otherParams) {
        var params = {};
        angular.extend(params, {}, otherParams);
        params[key] = {$regex: '^' + value};
        return $http.get(url, {
          params: {
            q: JSON.stringify(params)
          }
        }).then(function(res) {
          var items = [];
          angular.forEach(res.data.results, function(item) {
            items.push(item[key]);
          });
          return items;
        });
      };

      /**
       * Retourne une liste d'artistes existants dans la BDD
       *
       * @param {String} value - Un critère de filtre
       *
       * @returns {*}
       */
      $scope.getArtists = function(value) {
        return getItems('/songs/artists', 'artist', value);
      };

      /**
       * Retourne une liste d'albums existants dans la BDD
       *
       * @param {String} value - Un critère de filtre
       *
       * @returns {*}
       */
      $scope.getAlbums = function(value) {
        var params = {};
        //if ($scope.artist && scope.artist !== '') {
          //params.artist = scope.artist;
        //}
        return getItems('/songs/albums', 'album', value, params);
      };

      /**
       * Retourne une liste de genres existants dans la BDD
       *
       * @param {String} value - Un critère de filtre
       *
       * @returns {*}
       */
      $scope.getGenres = function(value) {
        return getItems('/songs/genres', 'genre', value);
      };
    }
  ])
  .controller('DiscogsController', [
    '$scope',
    '$http',
    'album',
    'artist',
    'releases',
    'pagination',
    function($scope, $http, album, artist, releases, pagination) {
      //angular.forEach(releases, function(release, index) {
        //releases[index].thumb = encodeURIComponent(release.thumb);
      //});
      $scope.releases = releases;
      $scope.pagination = pagination;
    }
  ]);

/* vim: set ts=2 sw=2 et ai: */
