'use strict';

/**
 * Module des bibliothèques
 *
 * Dépendances:
 *  - ngAnimate
 *  - xeditable
 */
angular.module('musicCollection.libraries', [
  'ngAnimate',
  'animations.details',
  'xeditable',
  'musicCollection.filters'
])
/**
 * Controleur des chansons
 */
  .controller('LibrariesController', [
    '$scope',
    '$http',
    '$stateParams',
    '$location',
    'Libraries',
    'mySocket',
    function ($scope, $http, $stateParams, $location, Libraries, mySocket) {

      mySocket.forward('update', $scope);
      mySocket.forward('check', $scope);
      mySocket.forward('error', $scope);

      $scope.remove = function(library, index) {
        if (library) {
          library.$remove({}, function(data, headers) {
            console.log(data, headers);
            $scope.libraries.splice(index, 1);
            $scope.totalItems--;
          }, function(httpResponse) {
            console.log(httpResponse);
          });
        }
      };

      /**
       * Permet de mettre à jour une chanson
       */
      $scope.update = function() {
        var library = $scope.library;
        if (!library.updated) {
          library.updated = [];
        }
        library.updated.push(new Date().getTime());

        library.$update(function() {
          $location.path('libraries/' + library._id);
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
          sort: ['title'],
          limit: $scope.itemsPerPage
        };
        if (arguments.length > 0) {
          params.q = JSON.stringify(arguments[0]);
        }
        console.log(params);
        Libraries.query(params, function(libraries) {
          $scope.libraries = libraries;
        });
      };

      /**
       * Permet de récupérer le nombre total de chansons dans la bibliothèque
       */
      $scope.count = function() {
        $http.get('/libraries/count')
          .success(function(data) {
            $scope.totalItems = data.count;
          });
      };
      $scope.count();

      /**
       * Permet de récupérer une chanson
       */
      $scope.findOne = function() {
        console.log('findOne');
        Libraries.get({
          libraryId: $stateParams.libraryId
        }, function(library) {
          console.log(library);
          $scope.library = library;
        });
      };

      if ($stateParams.libraryId) {
        console.log($stateParams.libraryId);
        $scope.findOne();
      }

      /**
       * Permet de mettre à jour une chanson
       *
       * @param {Resource} library - La chanson à mettre à jour
       */
      $scope.updateLibrary = function(library) {
        $http.put('/libraries/'+library._id, library)
          .error(function(data) {
            console.error(data);
            return 'Error: ' + data.msg;
          });
      };

      $scope.scanning = false; // Flag d'activation de l'analyse de la bibliothèque
      $scope.dynamic = 0; // Le pourcentage du nombre de chansons analysées
      $scope.libraryId = null; // Identifiant de la library
      $scope.confirm = false;
      $scope.errorFiles = null;
      $scope.stopped = false;

      /**
       * Permet de récupérer les chansons d'un répertoire ou d'une seule chanson
       */
      $scope.load = function() {
        $scope.loading = true;
        mySocket.emit('check_directory', {path: $scope.path});
      };

      $scope.$on('socket:check', function(event, data) {
        console.log(data);
        $scope.confirm = false;
        $scope.details = null;
        $scope.error = null;
        $scope.errorFiles = null;
        if (data.hasOwnProperty('itemsLength') && data.itemsLength > 0) {
          $scope.confirm = true;
          $scope.details = data.itemsLength + ' élément(s) trouvés. Ok pour le scan ?';
        } else if (data.hasOwnProperty('itemsLength')) {
          $scope.error = 'Aucun éléments trouvés dans le répertoire indiqué. Etes vous sur du chemin ?';
        }
        $scope.loading = false;
      });

      $scope.stop = function() {
        mySocket.forward('stop');
        $scope.stopped = true;
        mySocket.emit('stop_scan', {stop: true});
      };

      $scope.$on('socket:stop', function(event, data) {
        $scope.details = data.msg;
      });

      $scope.scan = function() {
        $scope.details = null;
        $scope.error = null;
        $scope.errorFiles = null;
        mySocket.emit('scan_library', {name: $scope.name});
        $scope.scanning = true;
      };

      /**
       * Permet de récupérer les chansons d'un répertoire ou d'une seule chanson
       */
      $scope.add = function() {
        if (!$scope.library) {
          var msg = 'modèle Library manquant';
          console.warn(msg);
          $scope.error = msg;
          return;
        }
        $scope.details = null;
        $scope.error = null;
        mySocket.emit('add_library', {path: $scope.path, id: $scope.library._id});
        $scope.scanning = true;
      };

      /**
       * En attente d'une information d'une socket pour chaque chanson analysée
       *
       * @event MySocket#update
       */
      $scope.$on('socket:update', function(ev, data) {
        var msg;
        // Fin de l'analyse du répertoire
        if (data.count === 0 && data.completed === 0 && data.added === 0) {
          msg = 'Aucun éléments trouvés dans le répertoire indiqué. Etes vous sur du chemin ?';
          $scope.error = msg;
          console.log(data);
          return;
        }
        else if (data.completed === data.count && data.hasOwnProperty('time')) {
          console.log(data);
          //var msg = 'Félicitations, vous venez d\'ajouter ' + data.count + ' éléments à votre collection en ' + data.time;
          msg = 'Félicitations, ' + data.added + ' élément(s) ont été ajoutés à votre nouvelle collection en ' + data.time + '.';
          // Des éléments se trouvaient déjà dans la collection ou il y a des fichiers en erreur
          if (data.added !== data.count && data.added > 0) {
            msg += '\n' + (data.count - (data.added - data.errors.length)) + ' éléments étaient déjà dans votre collection.';
          }
          // Aucun éléments ajoutés à la collection
          else if (data.added === 0) {
            msg = 'Aucun nouveaux éléments n\'ont été trouvés dans le chemin que vous nous avez donné.';
          }
          if (data.errors.length > 0) {
            msg += '\n' + data.errors.length + ' fichiers en erreur';
            $scope.errorFiles = data.errors;
          }
        } else {
          msg = data.details;
        }
        $scope.dynamic = Math.floor((data.completed * 100) / data.count); // Calcul du pourcentage réalisé
        $scope.details = msg;
        $scope.libraryId = data.library;
      });

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
