'use strict';

/**
 * Module des chansons
 *
 * Dépendances:
 *  - ngAnimate
 *  - xeditable
 *  - animations.details
 *  - directives.songDetails
 *  - directives.albumDetails
 *  - directives.artistDetails
 */
angular.module('musicCollection.songs', [
  'ngAnimate',
  'animations.details',
  'xeditable',
  'directives.songDetails'
])
/**
 * Controleur des chansons
 */
  .controller('SongsController', [
    '$scope',
    '$http',
    '$stateParams',
    '$location',
    'Songs',
    'Libraries',
    'mySocket',
    '$filter',
    function ($scope, $http, $stateParams, $location, Songs, Libraries, mySocket, $filter) {

      mySocket.forward('update', $scope);
      mySocket.forward('error', $scope);
      $scope.criteria = null;

      $scope.$watch('criteria', function(value) {
        if (value && value !== '') {
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

      $scope.detailsVisible = true; // Affiche ou non les détails en laissant la barre de navigation visible
      $scope.detailsSong = false; // La ressource pour les détails d'une chanson
      $scope.detailsAlbum = false; // La ressource pour les détails d'un album
      $scope.detailsArtist = false; // La ressource pour les détails d'un artist
      $scope.details = false; // Boolean pour afficher ou non le bloc complet des détails
      $scope.detailsType = null; // stocke le type d'infos pour le switch dans la template
      var oldDetails = {type:null, id:null}; // stocke la référence et le type d'informations qui ont été demandées

      $scope.showArtist = function(artist) {
        $location.path('/artists/' + $scope.library._id + '/' + encodeURIComponent(artist));
      };

      $scope.showAlbum = function(song) {
        $location.path('/albums/' + $scope.library._id + '/' + encodeURIComponent(song.artist) + '/' + encodeURIComponent(song.album));
      };

      /**
       * Définit le type d'informations détaillées à afficher:
       *  - une chanson
       *  - un album
       *  - un artiste
       * Affecte les variables nécessaires aux directives.
       *
       * @param {string} type - Le type d'informations à afficher
       * @param {Object} song - La ressource de la chanson
       */
      $scope.showDetails = function(type, song) {
        // Si on rappelle les mêmes informations
        if (oldDetails.type === type &&
          (oldDetails.id === song._id ||
            oldDetails.id === $filter('normalize')(song.album) ||
            oldDetails.id === $filter('normalize')(song.artist)
          )
        ) {
          // On switch les détails à l'aide d'un toggle
          $scope.details = !$scope.details;
          var items = null; // Contient les éléments de la requête jQuery en fonction du type
          if (oldDetails.type === 'song') {
            items = $('tr#' + song._id);
          } else if (oldDetails.type === 'album') {
            items = $('tr.' + $filter('normalize')(song.album));
          } else if (oldDetails.type === 'artist') {
            items = $('tr.' + $filter('normalize')(song.artist));
          }
          // On met en évidence les lignes correspondant aux informations
          if ($scope.details && items) {
            items.addClass('light-blue');
            $scope.detailsVisible = true;
          } else if (items) {
            items.removeClass('light-blue');
          }
          return;
        }
        $scope.detailsType = type; // pour le switch dans la template
        if (type === 'song') {
          $scope.detailsSong = song;
          oldDetails.id = song._id;
        } else if (type === 'album') {
          $scope.detailsAlbum = song;
          oldDetails.id = $filter('normalize')(song.album);
        } else if (type === 'artist') {
          $scope.detailsArtist = song;
          oldDetails.id = $filter('normalize')(song.artist);
        }
        oldDetails.type = type; // stocke le type de détails demandés
        $scope.details = true; // On affiche les détails
        $scope.detailsVisible = true; // Affiche le panneau des détails
      };

      /**
       * Permet d'ouvrir et fermer le panneau latéral
       * et de mettre en évidence les lignes concernées par les informations dans le panneau.
       */
      $scope.setDetailsVisible = function() {
        $scope.detailsVisible = !$scope.detailsVisible;
        if (!$scope.detailsVisible) {
          $('.song_table tbody tr').removeClass('light-blue');
        } else if (oldDetails.id && oldDetails.type === 'song') {
          $('tr#' + oldDetails.id).addClass('light-blue');
        } else if (oldDetails.id && (oldDetails.type === 'album' || oldDetails.type === 'artist')) {
          $('tr.' + oldDetails.id).addClass('light-blue');
        }
      };

      $scope.remove = function(song) {
        if (song) {
          song.$remove();

          for (var i in $scope.songs) {
            if ($scope.songs[i] === song) {
              $scope.songs.splice(i, 1);
            }
          }
        }
        else {
          $scope.song.$remove();
          $location.path('songs');
        }
      };

      /**
       * Permet de mettre à jour une chanson
       */
      $scope.update = function() {
        var song = $scope.song;
        if (!song.updated) {
          song.updated = [];
        }
        song.updated.push(new Date().getTime());

        song.$update(function() {
          $location.path('songs/' + song._id);
        });
      };

      $scope.currentPage = 1; // Numéro de la page courant pour la pagination
      $scope.itemsPerPage = 10; // Nombre de chansons par page

      /**
       * Permet de récupérer et d'afficher les chansons
       */
      $scope.find = function() {

        var params = {
          page: $scope.currentPage,
          sort: ['artist', 'track'],
          limit: $scope.itemsPerPage
        };
        if ($stateParams.libraryId) {
          Libraries.get({
            libraryId: $stateParams.libraryId
          }, function(library) {
            $scope.library = library;
          });
        }
        if ($scope.criteria && $scope.criteria !== '') {
          params.q = $scope.criteria;
        }
        if ($scope.library) {
          if (params.hasOwnProperty('q')) {
            params.q.library = $scope.library._id;
          } else {
            params.q = {library: $scope.library._id};
          }
        }
        if (params.hasOwnProperty('q')) {
          params.q = JSON.stringify(params.q);
        }
        console.log(params);
        Songs.query(params, function(songs) {
          $scope.count();
          $scope.songs = songs;
        });
      };

      /**
       * Permet de récupérer le nombre total de chansons dans la bibliothèque
       */
      $scope.count = function() {
        var url = '/songs/count';
        var params = {};
        if ($scope.criteria && $scope.criteria !== '') {
          params.q = $scope.criteria;
        }
        if ($scope.library) {
          if (params.hasOwnProperty('q')) {
            params.q.library = $scope.library._id;
          } else {
            params.q = {library: $scope.library._id};
          }
        }
        if (params.hasOwnProperty('q')) {
          url += '?q='+JSON.stringify(params.q);
        }

        $http.get(url)
          .success(function(data) {
            $scope.totalItems = data.count;
          });
      };
      $scope.count();

      /**
       * Permet de récupérer une chanson
       */
      $scope.findOne = function() {
        Songs.get({
          songId: $stateParams.songId
        }, function(song) {
          $scope.song = song;
        });
      };

      /**
       * Gère les cas d'erreur retournés par la socket
       *
       * @event MySocket#error
       */
      $scope.$on('socket:error', function(ev, data) {
        console.warn(data.msg);
        $scope.error = data.msg;
      });
    }
  ]
);

/* vim: set ts=2 sw=2 et ai: */
