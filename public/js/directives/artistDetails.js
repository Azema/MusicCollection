/**
 * Created by manuel on 30/03/14.
 */
'use strict';

angular.module('directives.artistDetails', ['musicCollection.filters'])
  .directive('artistDetails', ['$compile', '$http', '$filter', function($compile, $http, $filter) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        artistDetails: '='
      },
      template: '<div class="panel panel-default panel-primary artistDetails"><div class="panel-heading"><h3>{{artist}}</h3></div><div class="panel-body">Albums: <ul><li ng-repeat="album in albums">{{album}}</li></ul></div></div>',
      link: {
        post: function(scope, iElement) {
          scope.$watch('artistDetails',
            function (value) {
              if (value !== false && (!scope.artist || scope.artist !== value.artist)) {
                scope.id = value._id;
                scope.artist = value.artist;
                scope.albums = [];
                var url = '/songs?q=' + JSON.stringify({artist: scope.artist}) + '&limit=0&sort=album&page=1';
                $http.get(url)
                  .then(function(data) {
                    for (var i in data.data) {
                      if (scope.albums.indexOf(data.data[i].album) === -1) {
                        scope.albums.push(data.data[i].album);
                      }
                    }
                  }, function(data) {
                    console.error('Directive artistDetails - error', data);
                  }
                );
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
                var artistNormalize = $filter('normalize')(scope.artist);
                console.log(artistNormalize);
                $('tr.' + artistNormalize).addClass('light-blue');
              }
            }
          );
        }
      }
    };
  }]);