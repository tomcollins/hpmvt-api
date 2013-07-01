$(document).ready(function(){

  function getExperiments(callback) {
    $.ajax({
      url: '/experiments',
      dataType: 'json',
      success: function(data) {
        callback(data);
      }
    });
  };

  function getExperiment(id, callback) {
    $.ajax({
      url: '/experiments/' +id,
      dataType: 'json',
      success: function(data) {
        callback(data);
      }
    });
  };

  function showExperiments(experiments) {
    console.log('experiments', experiments);
    var uri
      , html = '<h2>Experiments:</h2>';
    html += '<p><a href="" id="experiment-add">Add new experiment</a></p>';
    html += '<table id="experiments"><tr><th>Project</th><th>Name</th></tr>';
    experiments.forEach(function(experiment){
      uri = '/experiments/' +experiment._id;
      html += '<tr>';
      html += '<td>' +experiment.project +'</td>';
      html += '<td><a href="' +uri +'">' +experiment.name +'</a></td>';
      html += '</tr>';
    });
    html += '</table>';
    $('#main').html(html);
    $('#experiments').on('click', experimentClick);
    $('#experiment-add').on('click', experimentAddClick);
  }

  function experimentClick(e) {
    e.preventDefault();
    var id = $(e.target).attr('href').split('/')[2];
    $('#experiments').off('click', experimentClick);
    getExperiment(id, showExperiment);
  }

  function experimentAddClick(e) {
    e.preventDefault();
    experiment = {
      project: "homepage",
      name: "Add name",
      type: "",
      selector: "",
      values: {
        "v1": "",
        "v2": ""
      },
      tracking: [
        {
          "type": "click",
          "selector": ""
        }
      ]
    };
    var html = '<a id="show-experiments" href="#">Back to experiment list</a>';
    html += '<div id="experiment">';
    html += '<h2>Add new experiment</h2>';
    html += '<div id="experiment-message"/>';
    html += '<form id="experiment-edit"><textarea wrap="off" rows="15" cols="80">' +JSON.stringify(experiment, null, 4) +'</textarea><input style="display: block;clear: both" type="submit"/></form>';
    $('#main').html(html);
    $('#show-experiments').on('click', showExperimentsClick);
    $(document).on("submit", "#experiment-edit", saveExperiment);
  }

  function saveExperiment(e) {
    var data = $('#experiment-edit textarea').val();
    e.preventDefault();
    try {
      data = JSON.parse(data)
    } catch(e) {
      $('#experiment-message').html('<p style="color:red">Invalid JSON.</p>');
      return;
    }
    console.log('data', data);
    $.ajax({
      url: '/experiments',
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(data),
      complete: function() {
        $('#experiment-message').html('<p style="color:green">Saved.</p>');
        showExperiment(data);
      }
    });
  };

  function showExperiment(experiment) {
    var html = '<a id="show-experiments" href="#">Back to experiment list</a>';
    html += '<div id="experiment">';
    html += '<h2>' +experiment.name +'</h2>';
    html += '<div id="experiment-message"/>';
    html += '<form id="experiment-edit"><textarea wrap="off" rows="15" cols="80">' +JSON.stringify(experiment, null, 4) +'</textarea><input style="display: block;clear: both" type="submit"/></form>';
    $('#main').html(html);
    $('#show-experiments').on('click', showExperimentsClick);
    $(document).on("submit", "#experiment-edit", updateExperiment);
  }

  function updateExperiment(e) {
    var data = $('#experiment-edit textarea').val();
    e.preventDefault();
    try {
      data = JSON.parse(data)
    } catch(e) {
      $('#experiment-message').html('<p style="color:red">Invalid JSON.</p>');
      return;
    }
    console.log('data', data);
    $.ajax({
      url: '/experiments/' +data._id,
      type: 'PUT',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(data),
      complete: function() {
        $('#experiment-message').html('<p style="color:green">Saved.</p>');
      }
    });
  };

  function showExperimentsClick(e) {
    e.preventDefault();
    $('#show-experiments').off('click', showExperimentsClick);
    getExperiments(showExperiments);
  };

  getExperiments(showExperiments);

});
