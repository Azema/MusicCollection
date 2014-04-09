'use strict';

/**
 * Module système
 *
 * Dépendances:
 */
angular.module('musicCollection.system', [])
/**
 * Controlleur des en-têtes du site
 */
  .controller('HeaderController', ['$rootScope', '$scope', 'Libraries', 'keyboardManager', function ($rootScope, $scope, Libraries, keyboardManager) {

    // Bind ctrl+a
    keyboardManager.bind('alt+s', function() {
      $('#search').focus();
    });
    /**
     * Eléments du menu
     *
     * @type {{title: string, link: string}[]}
     */
    $scope.menu = [{
      title: 'Add collection',
      href: '/#!/libraries/load'
    }];

    $scope.libraries = Libraries.query([], function(data) {
      var librariesMenu = {title: 'Collections', id: 'libraries', submenu: []};
      angular.forEach(data, function(library) {
        librariesMenu.submenu.push({
          title: library.title,
          id: library._id,
          type: 'collection',
          style: 'left:100%;top:0;',
          submenu: [
            { title: 'Songs', href: '/#!/songs/' + library._id },
            { title: 'Artists', href: '/#!/artists/' + library._id },
            {divider: true},
            { title: 'Add songs', href: '/#!/libraries/add/' + library._id },
            //{ title: 'Show', href: '/#!/libraries/' + library._id }
          ]
        });
      });
      $scope.menu.push(librariesMenu);
    });

    $scope.isCollapsed = false;
    $scope.hasLibraries = function() {
      return true;
    };

    /**
     * Déclenche un évènement pour la recherche qui est gérée dans le controlleur des chansons
     *
     * @event HeaderController#search
     */
    $scope.$watch('search', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        //console.log('header find: ' + newValue);
        $rootScope.$broadcast('search', newValue);
      }
    });
  }])

  .directive('menu', [function() {
    return {
      restrict: 'A',
      scope: {
        menu: '=menu',
        cls: '=ngClass'
      },
      replace: true,
      template: '<ul><li ng-repeat="item in menu" menu-item="item"></li></ul>',
      link: function(scope, element, attrs) {
        if (attrs['class'])
          element.addClass(attrs['class']);
        if (attrs['aria-labelledby'])
          element.attr('aria-labelledby', attrs['aria-labelledby']);
        if (attrs.role)
          element.attr('role', attrs.role);
        element.addClass(scope.cls);
      }
    };
  }])

  .directive('menuItem', ['$compile', '$location', function($compile, $location) {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        item: '=menuItem'
      },
      template: '<li ng-class="{active:isActive(item)}"><a href="{{item.href}}" ng-click="closeMenu()">{{item.title}}</a></li>',
      link: function (scope, element) {
        if (scope.item.header) {
          element.addClass('nav-header');
          element.text(scope.item.header);
        }
        if (scope.item.divider) {
          element.addClass('divider');
          element.empty();
        }
        if (scope.item.submenu) {
          element.addClass('dropdown');
          scope.$watch('opened', function(value) {
            element.removeClass('open');
            if (value) {
              element.addClass('open');
            }
          });
          scope.$on('closed', function(event) {
            event.preventDefault();
            scope.opened = false;
          });

          var text = element.children('a').text();
          var id = scope.item.id;
          element.empty();
          var $a = angular.element('<a id="'+id+'" role="button" href="javascript:void(0)" ng-click="opened=!opened">'+text+'<b class="caret"></b></a>');
          element.append($a);

          var $submenu = angular.element('<div menu="item.submenu" class="dropdown-menu" aria-labelledby="'+id+'" role="menu"></div>');
          if (scope.item.style) {
            $submenu.attr('style', scope.item.style);
          }
          element.append($submenu);
        } else {
          scope.closeMenu = function() {
            scope.$root.$broadcast('closed', true);
          };
        }
        if (scope.item.click) {
          element.find('a').attr('ng-click', 'item.click()');
        }
        $compile(element.contents())(scope);

        scope.isActive = function(item) {
          var active = false, re;
          if (item.hasOwnProperty('type') && item.type === 'collection') {
            re = new RegExp(item.id);
            active = re.test($location.path());
          } else if (item.hasOwnProperty('href')) {
            re = new RegExp('^' + item.href.substr(3));
            active =  re.test($location.path());
          }
          return active;
        };
      }
    };
  }]);

/* vim: set ts=2 sw=2 et ai: */
