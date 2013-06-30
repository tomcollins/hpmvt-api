function init(app) {

  var CollectionProvider = require('../lib/collectionprovider').CollectionProvider
    , statProvider= new CollectionProvider('stats', 'localhost', 27017)
    , imageBinary = new Buffer('R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', encoding='base64').toString('binary');

  app.get('/stats', function(req, res){
    statProvider.findAll( function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
      }
    });
  });

  app.get('/track', function(req, res){
    var isValidRequest = false
      , stat
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

    if (req.query && req.query.stat) {
      stat = String(req.query.stat).split(':');
      if (4 === stat.length) {
        isValidRequest = true;
        stat = {
          type: stat[0],
          project: stat[1],
          experiment: stat[2],
          variant: stat[3]
        }
      }
    }

    if (!isValidRequest) {
      res.writeHead(400, headers);
      res.write(buffer.toString('binary'), 'binary');
      res.end();
      return;
    }
    statProvider.save(stat, function( err, result) {
      if (err) {
        writeResponse(500);
      } else if (null === result) {
        writeResponse(404);
      } else {
        writeResponse(200);
      }
    });
  });

  app.post('/stats', function(req, res){
    statProvider.save(req.body, function( err, result) {
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        res.redirect('/stats')
      }
    });
  });

  app.get('/stats/:id', function(req, res){
    statProvider.findByInternalId(req.params.id, function(err, result){
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        return res.send(result);
      }
    });
  });

  app.put('/stats/:id', function(req, res){
    statProvider.updateByInternalId(req.params.id, req.body, function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        res.send('Error', 500);
        return console.log(err);
      }
    });
  });

  app.delete('/stats/:id', function(req, res){
    statProvider.remove(req.params.id, function( err, result) {
      res.send(req.param.id +' has been deleted.');
    });
  });

}

exports.init = init;
