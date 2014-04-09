/**
 * Created by manuel on 30/03/14.
 */
'use strict';

angular.module('directives.covers', [])
  .directive('covers', [function() {
    return {
      //priority: 1500,
      restrict: 'AE',
      replace: true,
      scope: {},
      template: '<div></div>',
      link: function(scope, iElt, iAttrs) {
        var albums = JSON.parse(iAttrs.albums),
          src, i, style, key, value,
          nbAlbums = 0,
          keys = [], tmp = albums;
        if (angular.isObject(albums)) {
          keys = Object.keys(albums);
          nbAlbums = keys.length;
        }

        var cleaned = false;
        for (i = 0; i < nbAlbums; i++) {
          if (albums[keys[i]] === null) {
            delete(tmp[keys[i]]);
            cleaned = true;
          }
        }
        if (cleaned) {
          albums = tmp;
          keys = Object.keys(albums);
          nbAlbums = keys.length;
        }

        if (nbAlbums === 0 || (nbAlbums === 1 && albums[keys[0]] === null)) {
          iElt.append(angular.element('<img src="/img/icons/interrogation.png"/>'));
        } else if (nbAlbums === 1) {
          src = '/cover/' + albums[keys[0]];
          iElt.append(angular.element('<img src="'+src+'"/>'));
        } else if (nbAlbums < 4) {
          for (i = 0; i < nbAlbums; i++) {
            key = keys[i];
            value = albums[key];
            if (i !== 0 && !value) {
              continue;
            }
            src = '/img/icons/interrogation.png';
            if (i === 0) {
              style = 'z-index:0;';
              if (!value) {
                style = 'z-index:-50';
              }
            } else if (i === 1) {
              style = 'z-index:-'+i+';left:15%;';
            } else {
              style = 'z-index:-'+i+';left:55%;';
            }
            style += '-webkit-transform:rotate(-30deg);';
            if (value) {
              src = '/cover/' + value;
            }
            iElt.append(angular.element('<img src="'+src+'" style="'+style+'" title="'+key+'" alt="'+key+'"/>'));
          }
        } else {
          var ratio = 180 / nbAlbums;
          for (i = 0; i < nbAlbums; i++) {
            key = keys[i];
            value = albums[key];
            if (i !== 0 && !value) {
              continue;
            }
            src = '/img/icons/interrogation.png';
            if (i === 0) {
              style = 'z-index:0;';
              if (!value) {
                style = 'z-index:-50';
              }
            } else if (value) {
              style = 'z-index:-'+i+';-webkit-transform:rotate('+(i*ratio)+'deg);';
            }
            if (value) {
              src = '/cover/' + value;
            }
            iElt.append(angular.element('<img src="'+src+'" style="'+style+'"/> title="'+key+'" alt="'+key+'"'));
          }
        }
      }
    };
  }]);
