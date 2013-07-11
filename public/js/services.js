'use strict';

/* Services */

angular.module('mvtApp.services', ['ngResource']).
  factory('Experiment', ['$resource', function($resource){
    return $resource('experiments/:experimentId', {experimentId:'@_id'}, {
      query: {method:'GET', params:{}, isArray:true},
      create: {method:'POST', params:{}},
      update: {method:'PUT', params:{}},
      delete: {method:'DELETE', params:{}}
    })
  }]).
  factory('Project', ['$resource', function($resource){
    return $resource('projects/:projectId', {projectId:'@_id'}, {
      query: {method:'GET', params:{}, isArray:true},
      create: {method:'POST', params:{}},
      update: {method:'PUT', params:{}},
      delete: {method:'DELETE', params:{}}
    })
  }]);

