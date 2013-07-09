'use strict';

angular.module('mvtApp', ['mvtApp.services', 'mvtApp.controllers']).

  /*
  config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
  }]).
*/

  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/experiments', {
      templateUrl: 'partials/experiment-list.html', 
      controller: 'ExperimentListCtrl'
    });
    $routeProvider.when('/experiments/:action', {
      templateUrl: 'partials/experiment-list.html', 
      controller: 'ExperimentListCtrl'
    });
    $routeProvider.when('/experiments/add', {
      templateUrl: 'partials/experiment-detail.html', 
      controller: 'ExperimentCreateCtrl'
    });
    $routeProvider.when('/experiments/:experimentId/:action', {
      templateUrl: 'partials/experiment-detail.html', 
      controller: 'ExperimentDetailCtrl'
    });
    $routeProvider.otherwise({redirectTo: '/experiments'});
  }]);