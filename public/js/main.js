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

  function showAlert(message, messageClass) {
    $('body').append('<p class="alert ' +messageClass +'">' +message +'</p>');
    setTimeout(function(){
      $('p.alert').fadeOut(1000, function(){
        $('p.alert').remove();
      });
    }, 2000);
  }

  function showExperiments(experiments) {
    var uri
      , html = '<h2>Experiments:</h2>';
    html += '<p><a href="#" id="experiment-add">Add new experiment</a></p>';
    html += '<table id="experiments" cellpadding="0" cellspacing="0"><tr><th>Name</th><th>Enabled</th><th>Project</th></tr>';
    experiments.forEach(function(experiment){
      uri = '/experiments/' +experiment._id;
      html += '<tr>';
      html += '<td><a href="#experiments/' +experiment._id +'">' +experiment.name +'</a></td>';
      html += '<td>' +(experiment.enabled ? 'Yes' : 'No') +'</td>';
      html += '<td>' +experiment.project +'</td>';
      html += '</tr>';
    });
    html += '</table>';
    $('#main').html(html);
    $('#experiments').on('click', experimentClick);
    $('#experiment-add').on('click', experimentAddClick);
  }

  function experimentClick(e) {
    //e.preventDefault();
    var id = $(e.target).attr('href').substr(1).split('/')[1];
    $('#experiments').off('click', experimentClick);
    getExperiment(id, showExperiment);
  }

  function experimentAddClick(e) {
    //e.preventDefault();
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
    html += '<form id="experiment-edit"><textarea wrap="off" rows="15" cols="80">' +JSON.stringify(experiment, null, 4) +'</textarea><input style="display: block;clear: both" type="submit"/></form>';
    $('#main').html(html);
    $('#show-experiments').on('click', showExperimentsClick);
    $(document).on("submit", "#experiment-edit", saveExperiment);
  }

  function saveExperiment(e) {
    e.preventDefault();
    var data = $('#experiment-edit textarea').val();
    try {
      data = JSON.parse(data)
    } catch(e) {
      showAlert('Invalid JSON', 'error');
      return;
    }
    $.ajax({
      url: '/experiments',
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(data),
      complete: function() {
        showAlert('Saved', 'success');
        showExperiment(data);
      }
    });
  };

  function showExperiment(experiment) {
    var view = [], click = [], variants = { v1: {view:0, click: 0}, v2: {view:0, click: 0}};

    experiment.stats.forEach(function(experiment){
      if ('view' == experiment.type) {
        view.push(experiment);
      } else if ('click' == experiment.type) {
        click.push(experiment);
      }
      variants[experiment.variant][experiment.type]++;
    });

    var html = '<a id="show-experiments" href="#">Back to experiment list</a>';
    html += '<div id="experiment">';
    html += '<h2>' +experiment.name +'</h2>';
    html += '<p>Type:' +experiment.type +'</p>';

    html += '<h3>Variants</h3>';
    html += '<table id="variants" cellpadding="0" cellspacing="0"><tr><th>Key</th><th>Value</th><th>Views</th><th>Clicks</th></tr>';
    for (var key in experiment.values) {
      html += '<tr>';
      html += '<td>' +key +'</td>';
      html += '<td>' +experiment.values[key] +'</td>';
      html += '<td>' +variants[key].view  +'</td>';
      html += '<td>' +variants[key].click +'</td>';
      html += '</tr>';
    };
    html += '</table>';

    html += '<h3>Views: ' +view.length +'</h3>';
    html += '<ul>';
    view.forEach(function(view){
      html += '<li>' +view.variant +' - ' +view.created_at +'</li>';
    });
    html += '</ul>';
    html += '<h3>Clicks: ' +click.length +'</h3>';
    html += '<ul>';
    click.forEach(function(click){
      html += '<li>' +click.variant +' - ' +click.created_at +'</li>';
    });
    html += '</ul>';

    delete experiment.stats;
    html += '<h3>Edit config:</h3>';
    html += '<form id="experiment-edit"><textarea wrap="off" rows="15" cols="80">' +JSON.stringify(experiment, null, 4) +'</textarea><input style="display: block;clear: both" type="submit"/></form>';
    $('#main').html(html);
    $('#show-experiments').on('click', showExperimentsClick);
    $(document).on("submit", "#experiment-edit", updateExperiment);
  }

  function updateExperiment(e) {
    e.preventDefault();
    var data = $('#experiment-edit textarea').val();
    try {
      data = JSON.parse(data)
    } catch(e) {
      showAlert('Invalid JSON', 'error');
      return;
    }
    $.ajax({
      url: '/experiments/' +data._id,
      type: 'PUT',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(data),
      complete: function() {
        showAlert('Saved', 'success');
      }
    });
  };

  function showExperimentsClick(e) {
    //e.preventDefault();
    $('#show-experiments').off('click', showExperimentsClick);
    getExperiments(showExperiments);
  };

  if (window.location.hash.length) {
    var hash = window.location.hash.substr(1).split('/');
    if ('experiments' == hash[0]) {
      getExperiment(hash[1], showExperiment);
      return;
    }
  }
  getExperiments(showExperiments);

});
