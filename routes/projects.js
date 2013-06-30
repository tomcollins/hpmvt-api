function init(app) {

  var CollectionProvider = require('../lib/collectionprovider').CollectionProvider;
  var projectProvider= new CollectionProvider('projects', 'localhost', 27017);

  app.get('/projects', function(req, res){
    console.log('GET /projects');
    projectProvider.findAll( function(err, result){
      console.log('projects', err, result);
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
      }
    });
  });

  app.post('/projects', function(req, res){
    console.log('POST /projects', req.body);
    projectProvider.save(req.body, function( err, result) {
      if (err) {
        console.log('! saved project err', err);
        res.send('Error', 500);
      } else if (null === result) {
        console.log('! saved project', result);
        res.send('Not Found', 404);
      } else {
        console.log('saved project', result);
        res.redirect('/projects')
      }
    });
  });

  app.get('/projects/:id', function(req, res){
    projectProvider.findByInternalId(req.params.id, function(err, result){
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        return res.send(result);
      }
    });
  });

  app.put('/projects/:id', function(req, res){
    console.log('PUT project', req.params.id);
    projectProvider.updateByInternalId(req.params.id, req.body, function(err, result){
      if (!err) {
        console.log('saved')
        return res.send(result);
      } else {
        console.log('error saving')
        return console.log(err);
      }
    });
  });

  app.delete('/projects/:id', function(req, res){
    projectProvider.remove(req.params.id, function( err, result) {
      res.send('Library ' +req.param.id +' has been deleted.');
    });
  });

}

exports.init = init;
