function init(app) {

  var CollectionProvider = require('../lib/collectionprovider').CollectionProvider;
  var experimentProvider= new CollectionProvider('experiments', 'localhost', 27017);
  var statProvider= new CollectionProvider('stats', 'localhost', 27017);

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
      options.enabled = req.query.enabled;
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
        console.log('result', result);
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
          }
        });
      }
    });
  });

  app.put('/experiments/:id', function(req, res){
    console.log('id', req.params.id);
    console.log('req.body', req.body);
    experimentProvider.updateByInternalId(req.params.id, req.body, function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
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
