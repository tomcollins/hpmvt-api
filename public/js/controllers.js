'use strict';

angular.module('mvtApp.controllers', ['ui.bootstrap']).

  controller('ExperimentListCtrl', ['$scope', '$routeParams', 'Experiment', function($scope, $routeParams, Experiment) {
    $scope.experiments = Experiment.query();

    // ui

    $scope.alerts = [];
    if ('deleted' == $routeParams.action) {
      $scope.alerts.push({type: 'info', msg: 'Experiment has been deleted.' });
    };
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  }]).

  controller('ExperimentCreateCtrl', ['$scope', '$location', '$routeParams', 'Experiment', function($scope, $location, $routeParams, Experiment) {
    $scope.action = 'create';
    $scope.editMode = false;
    $scope.editTabLabel = 'Add Experiment';
    $scope.experiment = new Experiment();
    $scope.save = function() {
      Experiment.create($scope.experiment, function(data) {
        $location.path('/experiments/' +data._id +'/new');
      });
    }

    // ui

    $scope.tabs = [
      { 
        title: 'Create Experiment', 
        content: 'partials/experiment-form.html'
      }
    ];
  }]).

  controller('ExperimentDetailCtrl', ['$scope', '$location', '$routeParams', 'Experiment', function($scope, $location, $routeParams, Experiment) {
    $scope.action = $routeParams.action;
    $scope.editMode = true;
    $scope.editTabLabel = 'Edit Experiment';
    $scope.firstEdit = 'new' === $routeParams.action;
    $scope.experiment = Experiment.get({experimentId: $routeParams.experimentId}, function(experiment) {
      $scope.experiment.variantsString = JSON.stringify($scope.experiment.variants, null, 4);
      $scope.experiment.trackingString = JSON.stringify($scope.experiment.tracking, null, 4);
    });
    $scope.save = function() {
      var experiment = angular.copy($scope.experiment);
      experiment.variants = JSON.parse($scope.experiment.variantsString);
      experiment.tracking = JSON.parse($scope.experiment.trackingString);
      delete experiment.variantsString;
      delete experiment.trackingString;
      Experiment.update(experiment, function(data) {
        if ($scope.firstEdit) {
          $scope.closeAlert(0);
          $scope.firstEdit = false;
        }
        $scope.alerts.push({type: 'success', msg: 'Your experiment has been saved.' });
      });
    };

    $scope.delete = function() {
      console.log('delete', $scope.experiment._id);
      Experiment.delete({experimentId: $scope.experiment._id}, function(data) {
        $location.path('/experiments/deleted');
      });
    };

    $scope.selectTab = function() {
      if (1 === this.$index) {
        $('#graph').html('<p>Loading data.</p>');
        $.ajax({
          url: '/experiments/' +$scope.experiment._id +'/report',
          dataType: 'json',
          success: function(reportData) {
            addVariantsTable($scope.experiment.variants, reportData)
            addGraph(reportData);
          }
        });
      }
    };

    // ui

    $scope.tabs = [
      { 
        title: $scope.editMode ? 'Edit Experiment' : 'Create Experiment', 
        content: 'partials/experiment-form.html'
    }];
    if ($scope.editMode) {
      $scope.tabs.push({ 
        title: 'Report', 
        content: 'partials/experiment-report.html'
      });
    };

    $scope.alerts = [];
    if ($scope.firstEdit) {
      $scope.alerts.push({type: 'success', msg: 'Your experiment has been created.' });
    };
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  }]).

  controller('ProjectListCtrl', ['$scope', '$routeParams', 'Project', function($scope, $routeParams, Project) {
    $scope.projects = Project.query();

    // ui

    $scope.alerts = [];
    if ('deleted' == $routeParams.action) {
      $scope.alerts.push({type: 'info', msg: 'Project has been deleted.' });
    };
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  }]).

  controller('ProjectCreateCtrl', ['$scope', '$location', '$routeParams', 'Project', function($scope, $location, $routeParams, Project) {
    $scope.action = 'create';
    $scope.editMode = false;
    $scope.editTabLabel = 'Add Project';
    $scope.project = new Project();
    $scope.save = function() {
      Project.create($scope.project, function(data) {
        $location.path('/project/' +data._id +'/new');
      });
    }
  }]).

  controller('ProjectDetailCtrl', ['$scope', '$location', '$routeParams', 'Project', function($scope, $location, $routeParams, Project) {
    $scope.action = $routeParams.action;
    $scope.editMode = true;
    $scope.editTabLabel = 'Edit Project';
    $scope.firstEdit = 'new' === $routeParams.action;
    $scope.project = Project.get({projectId: $routeParams.projectId}, function(project) {
      $scope.project.routesString = JSON.stringify($scope.project.routes, null, 4);
    });
    $scope.save = function() {
      var project = angular.copy($scope.project);
      project.routes = JSON.parse($scope.project.routesString);
      delete project.routesString;
      Project.update(project, function(data) {
        if ($scope.firstEdit) {
          $scope.closeAlert(0);
          $scope.firstEdit = false;
        }
        $scope.alerts.push({type: 'success', msg: 'Your project has been saved.' });
      });
    };

    $scope.delete = function() {
      Project.delete({projectId: $scope.project._id}, function(data) {
        $location.path('/projects/deleted');
      });
    };

    // ui

    $scope.alerts = [];
    if ($scope.firstEdit) {
      $scope.alerts.push({type: 'success', msg: 'Your project has been created.' });
    };
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  }]);



function addGraph(reportData) {
  var chartData = {
    labels : reportData.xLabels,
    datasets : [
      {
        fillColor : "rgba(220,220,220,0.5)",
        strokeColor : "rgba(220,220,220,1)",
        pointColor : "rgba(220,220,220,1)",
        pointStrokeColor : "#fff",
        data : reportData.views
      },
      {
        fillColor : "rgba(151,187,205,0.5)",
        strokeColor : "rgba(151,187,205,1)",
        pointColor : "rgba(151,187,205,1)",
        pointStrokeColor : "#fff",
        data : reportData.clicks
      }
    ]
  };
  $('#graph').html('<canvas id="graph-canvas" width="640" height="200"></canvas>');
  new Chart($("#graph-canvas").get(0).getContext("2d")).Line(chartData, {});
};

function addVariantsTable(variants, reportData) {
  var index = 0
    , views
    , clicks
    , success
    , html = '';

  html += '<table class="table table-striped"><tr><th>Name</th><th>Success</th><th>Views</th><th>Clicks</th></tr>';
  variants.forEach(function(variant) {
    views = reportData.variants[index].views;
    clicks = reportData.variants[index].clicks;
    success = 0 === clicks ? 0 : ((clicks/views)*100);
    if (isNaN(success)) success = 0;
    html += '<tr>';
    html += '<td>' +variant.name +'</td>';
    html += '<td>' +success.toFixed(2)  +'%</td>';
    html += '<td>' +views  +'</td>';
    html += '<td>' +clicks +'</td>';
    html += '</tr>';
    index++;
  });
  html += '</table>';
  $('#variants-table').html(html);
}
