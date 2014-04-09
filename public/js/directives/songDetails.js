/**
 * Created by manuel on 30/03/14.
 */
'use strict';

angular.module('directives.songDetails', [
  'xeditable',
  'ui.bootstrap',
  'musicCollection.filters'
])
  .directive('songDetails', ['$compile', '$http', function($compile, $http) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        songDetails: '='
      },
      template: '<div class="panel panel-default panel-primary songDetails">'+
        '<div class="panel-heading"><h3 editable-text="songDetails.title" onaftersave="updateSong()">{{songDetails.title}}</h3></div>'+
        '<div class="panel-body">'+
          '<p editable-text="songDetails.album" e-typeahead="album for album in getAlbums($viewValue) | filter:$viewValue" e-typeahead-loading="loadingAlbums" onaftersave="updateSong()">Album: {{songDetails.album}}</p>'+
          '<i ng-show="loadingAlbums" class="glyphicon glyphicon-refresh"></i>'+
          '<p editable-text="songDetails.artist" e-typeahead="artist for artist in getArtists($viewValue) | filter:$viewValue" e-typeahead-loading="loadingArtists" onaftersave="updateSong()">Artist: {{songDetails.artist}}</p>'+
          '<i ng-show="loadingArtists" class="glyphicon glyphicon-refresh"></i>'+
          '<p editable-text="songDetails.genre" e-typeahead="genre for genre in getGenres($viewValue) | filter:$viewValue" e-typeahead-loading="loadingGenres" onaftersave="updateSong()">Genre: {{songDetails.genre}}</p>'+
          '<i ng-show="loadingGenres" class="glyphicon glyphicon-refresh"></i>'+
          '<p editable-text="songDetails.year" onbeforesave="checkYear($data)" onaftersave="updateSong()">Year: {{songDetails.year}}</p>'+
          '<p>Duration: {{songDetails.duration|duration}}</p>'+
          '<p editable-text="songDetails.track" onbeforesave="checkTrack($data)" onaftersave="updateSong()">Track: {{songDetails.track}}</p>'+
          '<p>Disk: {{songDetails.disk}}</p>'+
          '<p>Bitrate: {{songDetails.bitrate}}</p>'+
          '<p title="{{songDetails.location}}">Path: {{songDetails.location|mcLimitTo:20}}</p>'+
          '<div id="cover"></div>'+
        '</div></div>',
      link: {
        post: function(scope, iElement) {
          scope.$watch('songDetails', function (value) {
            if (value !== false) {
              var cover;
              if (value.cover_location && value.cover_location !== undefined && value.cover_location !== '') {
                cover = $compile('<img ng-src="/cover/{{songDetails._id}}" class="cover details_cover"/>')(scope);
              } else {
                cover = $compile('<i class="fa fa-question unknown_cover details_cover"></i>')(scope);
              }
              if (! value.title || value.title === '') {
                value.title = 'Unknown';
              }
              var itemCover = $('.details_cover', iElement);
              if (itemCover) {
                itemCover.remove();
              }
              $('div#cover', iElement).append(cover);
              $('.song_table tbody tr').removeClass('light-blue');
              $('tr#' + scope.songDetails._id).addClass('light-blue');
            }
          });

          /**
           * Permet de vérifier le format d'une année (YYYY),
           * retourne true lorsque c'est correct, sinon retourne un message d'erreur
           *
           * @param {string} data - L'année à vérifier
           * @returns {*}
           */
          scope.checkYear = function(data) {
            var test = /^\d{4}$/.test(data);
            if (!test) {
              return 'Année incorrecte';
            }
            return true;
          };
          scope.checkTrack = function(data) {
            if (!/^\d{1,}$/.test(data)) {
              return 'Piste incorrecte';
            }
            return true;
          };

          /**
           * Permet de mettre à jour l'objet du scope (songDetails)
           *
           */
          scope.updateSong = function() {
            return scope.songDetails.$update();
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
          scope.getArtists = function(value) {
            return getItems('/songs/artists', 'artist', value);
          };

          /**
           * Retourne une liste d'albums existants dans la BDD
           *
           * @param {String} value - Un critère de filtre
           *
           * @returns {*}
           */
          scope.getAlbums = function(value) {
            var params = {};
            if (scope.songDetails.artist && scope.songDetails.artist !== '') {
              params.artist = scope.songDetails.artist;
            }
            return getItems('/songs/albums', 'album', value, params);
          };

          /**
           * Retourne une liste de genres existants dans la BDD
           *
           * @param {String} value - Un critère de filtre
           *
           * @returns {*}
           */
          scope.getGenres = function(value) {
            return getItems('/songs/genres', 'genre', value);
          };
        }
      }
    };
  }]);

/* vim: set ts=2 sw=2 et ai: */
