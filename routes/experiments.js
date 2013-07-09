function init(app) {

  var CollectionProvider = require('../lib/collectionprovider').CollectionProvider;
  var experimentProvider= new CollectionProvider('experiments', 'localhost', 27017);
  var statProvider= new CollectionProvider('tracking', 'localhost', 27017);

  app.get('/experiments', function(req, res){
    experimentProvider.findAll( function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
      }
    });
  });

  app.get('/experiments/project/:id', function(req, res){
    var options = {project: req.params.id};
    if (req.query.enabled) {
      options.enabled = Boolean(req.query.enabled);
    }
    experimentProvider.findByObject(options, function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
      }
    });
  });

  app.post('/experiments', function(req, res){
    experimentProvider.save(req.body, function( err, result) {
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        res.redirect('/experiments/' +result[0]._id)
      }
    });
  });

  app.get('/experiments/:id', function(req, res){
    experimentProvider.findByInternalId(req.params.id, function(err, result){
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        return res.send(result);
      }
    });
  });

  app.get('/experiments/:id/stats', function(req, res){
    statProvider.findByObject({experiment: req.params.id}, function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
        res.send('Error', 500);
      }
    });
  });

  app.get('/experiments/:id/report', function(req, res){
    experimentProvider.findByInternalId(req.params.id, function(err, experiment){
      if (err) {
        res.send('Error', 500);
      } else if (null === experiment) {
        res.send('Not Found', 404);
      } else {
        statProvider.findByObject({experiment: req.params.id}, function(err, stats){
          if (err) {
            res.send('Error', 500);
          } else if (null === stats) {
            res.send('Not Found', 404);
          } else {
            return res.send(processReport(experiment, stats));
          }
        });
      }
    });
  });

  app.put('/experiments/:id', function(req, res){
    if (!'object' == typeof req.body || !req.body._id) {
      res.send('Bad Request', 400);
      return;
    }
    experimentProvider.updateByInternalId(req.params.id, req.body, function(err, result){
      if (!err) {
        res.send(req.body);
        res.end();
      } else {
        return console.log(err);
        res.send('Error', 500);
      }
    });
  });

  app.delete('/experiments/:id', function(req, res){
    experimentProvider.remove(req.params.id, function( err, result) {
      res.send('Experiment ' +req.param.id +' has been deleted.');
    });
  });

}


function processReport(experiment, stats) {
  var variants = []
    , time
    , startTime = null
    , finishTime = null;


  if (experiment.variants) {
    experiment.variants.forEach(function(variant) {
      variants.push({name: variant.name, views:0, clicks:0});
    });
  }

  stats.forEach(function(stat) {
    time = new Date(stat.created_at).getTime();
    stat.time = time;
    if (time < startTime || null === startTime) startTime = time;
    if (time > finishTime || null === finishTime) finishTime = time;
    if (stat.variant && variants[stat.variant]) {
      if ('view' === stat.type) {
        variants[stat.variant].views++;
      } else if ('click' === stat.type) {
        variants[stat.variant].clicks++;
      }
    }
  });

  var noOfSteps = 20
    , stepIndex
    , stepDuration = (finishTime - startTime) / noOfSteps
    , stepTime
    , stepDate
    , xValues = []
    , views = []
    , clicks = [];

  stepTime = startTime;
  for (stepIndex = 0; stepIndex <= noOfSteps; stepIndex++) {
    views.push(0);
    clicks.push(0);
    stepTime += stepDuration;
    stepDate = new Date(stepTime);
    xValues.push((stepDate.getMonth()+1) +'/' +stepDate.getDate() +' ' +stepDate.getHours() +':' +stepDate.getMinutes() +':' +stepDate.getSeconds());
    //xSeries.push(stepDate.getTime());
  };
  stats.forEach(function(stat){
    stepIndex = Math.floor((stat.time-startTime)/stepDuration);
    if ('view' == stat.type) {
      views[stepIndex]++;
    } else if ('click' == stat.type) {
      clicks[stepIndex]++;
    }
  });
  return {
    started_at: new Date(startTime),
    finished_at: new Date(finishTime),
    variants: variants,
    xLabels: xValues,
    views: views,
    clicks: clicks
  }
};

exports.init = init;
