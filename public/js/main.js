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
    $(document).off("submit", "*");
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
      enabled: true,
      project: "homepage",
      name: "Add name",
      variants: [{
        "name": "Variant 1",
        "css": "p{color: red}",
        "jquery": {
          "server": "$(\"body\").append(\"Added using \\\"jquery\\\")"
        }
      }],
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
    $('#experiment-edit').on("submit", saveExperiment);
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

  function getGraphData(stats, startTime, stopTime) {
    var views = []
      , clicks = []
      , xSeries = []
      , xValues = []
      , timeStep = (stopTime - startTime) / 20
      , date;
    for (var step = 0; step <= 20; step++) {
      views.push(0);
      clicks.push(0);
      date = new Date(Math.floor(startTime + (step * timeStep)));
      xValues.push((date.getMonth()+1) +'/' +date.getDate() +' ' +date.getHours() +':' +date.getMinutes() +':' +date.getSeconds());
      xSeries.push(date.getTime());
    };
    stats.forEach(function(stat){
      var step = Math.floor((stat.time-startTime)/timeStep);
      if ('view' == stat.type) {
        views[step]++;
      } else if ('click' == stat.type) {
        clicks[step]++;
      }
    });
    return {
      start: startTime,
      stop: stopTime,
      timeStep: timeStep,
      xValues: xValues,
      xSeries: xSeries,
      views: views,
      clicks: clicks
    }
  };

  function addGraph(data) {
    var data = {
      labels : graphData.xValues,
      datasets : [
        {
          fillColor : "rgba(220,220,220,0.5)",
          strokeColor : "rgba(220,220,220,1)",
          pointColor : "rgba(220,220,220,1)",
          pointStrokeColor : "#fff",
          data : graphData.views
        },
        {
          fillColor : "rgba(151,187,205,0.5)",
          strokeColor : "rgba(151,187,205,1)",
          pointColor : "rgba(151,187,205,1)",
          pointStrokeColor : "#fff",
          data : graphData.clicks
        }
      ]
    };
    $('#main table').after('<canvas id="chart" width="640" height="200"></canvas>');
    new Chart($("#chart").get(0).getContext("2d")).Line(data, {

    });
  };

  function getVariantsTable(variants, variantsStats) {
    var index = 0
      , views
      , clicks
      , success
      , html = '<h3>Variants</h3>';
    html += '<table id="variants" cellpadding="0" cellspacing="0"><tr><th>Name</th><th>Success</th><th>Views</th><th>Clicks</th></tr>';
    variants.forEach(function(variant) {
      views = variantsStats[index].view;
      clicks = variantsStats[index].click;
      if (0 === clicks) {
        success = 0;
      } else {
        success = ((clicks/views)*100);
      }      
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
    return html;
  }

  function showExperiment(experiment) {
    var view = [], click = [], variants = [];

    if (experiment.variants) {
      experiment.variants.forEach(function(variant) {
        variants.push({view:0,click:0});
      });
    }

    var minTime = null;
    var maxTime = null;
    var duration, hours, minutes, xStep, yStep;
    var viewGraphData;
    var date;
    if (experiment.stats) {
      experiment.stats.forEach(function(stat){
        if (stat.variant < experiment.variants.length) {
          stat.time = new Date(stat.created_at).getTime();
          if (stat.time < minTime || null === minTime) minTime = stat.time;
          if (stat.time > maxTime || null === maxTime) maxTime = stat.time;
          if ('view' == stat.type) {
            view.push(stat);
          } else if ('click' == stat.type) {
            click.push(stat);
          }
          if (variants[stat.variant] && variants[stat.variant][stat.type]) {
            variants[stat.variant][stat.type]++;
          }
        }
      });
    }
    //duration = maxTime - minTime;
    //minutes = Math.ceil(duration/60);
    //hours = Math.ceil(minutes/60); 

    var html = '<a id="show-experiments" href="#">Back to experiment list</a>';
    html += '<div id="experiment">';
    html += '<h2>' +experiment.name +'</h2>';

    if (experiment.variants) {
      html += getVariantsTable(experiment.variants, variants);

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

      graphData = getGraphData(experiment.stats, minTime, maxTime);
    }

    delete experiment.stats;
    html += '<h3>Edit config:</h3>';
    html += '<form id="experiment-edit"><textarea wrap="off" rows="15" cols="80">' +JSON.stringify(experiment, null, 4) +'</textarea><input style="display: block;clear: both" type="submit"/></form>';
    $('#main').html(html);

    if (experiment.variants) {
      addGraph(graphData);
    }

    $('#show-experiments').on('click', showExperimentsClick);
    $('#experiment-edit').on("submit", updateExperiment);
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
