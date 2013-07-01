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
        statProvider.findByObject({experiment: req.params.id}, function(err, stats){
          if (!err) {
            result.stats = stats; 
            return res.send(result);
          } else {
            return console.log(err);
            res.send('Error', 500);
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

exports.init = init;
