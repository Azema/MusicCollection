/**
 * Created by manuel on 30/03/14.
 */
'use strict';

angular.module('directives.albumDetails', ['musicCollection.filters'])
  .directive('albumDetails', ['$compile', '$filter', '$http', function($compile, $filter, $http) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        albumDetails: '='
      },
      template: '<div class="panel panel-default panel-primary albumDetails">'+
        '<div class="panel-heading"><h3>{{albumDetails.album}}</h3></div>'+
        '<div class="panel-body">'+
          '<p editable-text="albumDetails.artist" e-typeahead="artist for artist in getArtists($viewValue) | filter:$viewValue" e-typeahead-loading="loadingArtists" onaftersave="updateArtist($data)">Artist: {{albumDetails.artist}}</p>' +
          '<p>Genre: {{albumDetails.genre}}</p><p>Year: {{albumDetails.year}}</p>'+
          '<p>Tracks: {{albumDetails.track.of}}</p><p>Disks: {{albumDetails.disk.of}}</p>'+
        '</div></div>',
      link: {
        post: function(scope, iElement) {
          scope.$watch('albumDetails',
            function (value) {
              if (value !== false && (!scope.album || scope.album !== value.album)) {
                scope.id = value._id;
                var cover;
                if (value.cover_location && value.cover_location !== undefined && value.cover_location !== '') {
                  cover = $compile('<img ng-src="/cover/{{id}}" class="cover details_cover"/>')(scope);
                } else {
                  cover = $compile('<i class="fa fa-question unknown_cover details_cover"></i>')(scope);
                }
                var itemCover = $('.details_cover', iElement);
                if (itemCover) {
                  itemCover.remove();
                }
                $('.panel-body', iElement).append(cover);
                $('.song_table tbody tr').removeClass('light-blue');
                $('tr.' + $filter('normalize')(value.album)).addClass('light-blue');
              }
            }
          );

          /**
           * Permet de mettre à jour l'objet du scope (songDetails)
           *
           */
          scope.updateArtist = function($value) {
            var url = '/songs/multi/?q=' + JSON.stringify({album: scope.albumDetails.album, library: scope.albumDetails.library});
            return $http.put(url, {artist: $value});
          };

          /**
           * Récupère une liste de données à l'aide de l'URL fournit en paramètre et d'une clef de récupération.
           * Une valeur peut être fournit pour filtrer les données.
           *
           * @param {String} url         - L'URI d'accès aux données
           * @param {String} key         - La clef correspondant au type de donnée à récupérer (paramètre et résultats)
           * @param {String} value       - La valeur servant de filtre
           * @param {Object} otherParams - Paramètres additionnels
           *
           * @returns {*}
           */
          var getItems = function(url, key, value, otherParams) {
            otherParams = otherParams || {};
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
            return getItems('/songs/artists', 'artist', value, {});
          };
        }
      }
    };
  }]);