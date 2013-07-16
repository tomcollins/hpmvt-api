function init(app) {

  var CollectionProvider = require('../lib/collectionprovider').CollectionProvider
    , impressionProvider= new CollectionProvider('impressions', 'localhost', 27017)
    , imageBinary = new Buffer('R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', encoding='base64').toString('binary');

  app.get('/impression', function(req, res){
    var isValidRequest = false
      , impression
      , headers = {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
      , writeResponse;

    writeResponse = function(status) {
      res.writeHead(status, headers);
      res.write(imageBinary, 'binary');
      res.end();
    };

    if (req.query && req.query.url && req.cookies.userId) { 
      isValidRequest = true;
      impression = {
        url: req.query.url,
        userId: req.cookies.userId
      }
    }

    if (!isValidRequest) {
      res.writeHead(400, headers);
      res.write(buffer.toString('binary'), 'binary');
      res.end();
      return;
    }
    impressionProvider.save(impression, function( err, result) {
      if (err) {
        writeResponse(500);
      } else if (null === result) {
        writeResponse(404);
      } else {
        writeResponse(200);
      }
    });
  });


  app.get('/impressions', function(req, res){
    impressionProvider.findAll( function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
      }
    });
  });

  app.post('/impressions', function(req, res){
    impressionProvider.save(req.body, function( err, result) {
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        res.redirect('/impressions')
      }
    });
  });

  app.get('/impressions/:id', function(req, res){
    impressionProvider.findByInternalId(req.params.id, function(err, result){
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        return res.send(result);
      }
    });
  });

  app.put('/impressions/:id', function(req, res){
    impressionProvider.updateByInternalId(req.params.id, req.body, function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        res.send('Error', 500);
        return console.log(err);
      }
    });
  });

  app.delete('/impressions/:id', function(req, res){
    impressionProvider.remove(req.params.id, function( err, result) {
      res.send(req.param.id +' has been deleted.');
    });
  });

}

exports.init = init;
