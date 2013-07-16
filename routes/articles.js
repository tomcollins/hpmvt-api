function init(app) {

  var CollectionProvider = require('../lib/collectionprovider').CollectionProvider;
  var articleProvider= new CollectionProvider('articles', 'localhost', 27017);

  app.get('/articles', function(req, res){
    articleProvider.findAll( function(err, result){
      if (!err) {
        return res.send(result);
      } else {
        return console.log(err);
      }
    });
  });

  app.post('/articles/ingest', function(req, res){
    
    if (req.body && req.body.length) {
      console.log('Ingest', req.body.length, 'articles');
    } else {
      res.send('Bad request', 400);
    }

    var articlesRemaining = 0
      , articles = req.body;

    function articleComplete() {
      --articlesRemaining;
      console.log('Article saved.', articlesRemaining, 'remaining.');
      if (0 === articlesRemaining) {
        res.send('Ok', 200);
      }
    };

    if (articles.length) {
      articlesRemaining = articles.length;
      articles.forEach(function(article){
        articleProvider.findByObject({guid: article.guid}, function(err, result){
          if (err) {
            articleComplete();
          } else if (0 === result.length) {
            articleProvider.save(article, function( err, result) {
              articleComplete();
            });
          } else if (result.length) {
            if (!article.section && result[0].section) article.section = result[0].section;
            articleProvider.updateByInternalId(String(result[0]._id), article, function(err, result){
              articleComplete();
            });
          }
        });
      });
    } else {
      res.send('Nothing to save.', 200);
    }
  });

  app.post('/articles', function(req, res){
    articleProvider.save(req.body, function( err, result) {
      if (err) {
        console.log('! saved article err', err);
        res.send('Error', 500);
      } else if (null === result) {
        console.log('! saved article', result);
        res.send('Not Found', 404);
      } else {
        res.redirect('/articles')
      }
    });
  });

  app.get('/articles/:id', function(req, res){
    articleProvider.findByInternalId(req.params.id, function(err, result){
      if (err) {
        res.send('Error', 500);
      } else if (null === result) {
        res.send('Not Found', 404);
      } else {
        return res.send(result);
      }
    });
  });

  app.get('/articles/id/:id', function(req, res){
    var options = {id: req.params.id};
    articleProvider.findByObject(options, function(err, result){
      if (!err) {
        return res.send(result[0]);
      } else {
        return console.log(err);
      }
    });
  });

  app.put('/articles/:id', function(req, res){
    articleProvider.updateByInternalId(req.params.id, req.body, function(err, result){
      if (!err) {
        console.log('saved')
        return res.send(result);
      } else {
        console.log('error saving')
        return console.log(err);
      }
    });
  });

  app.delete('/articles/:id', function(req, res){
    articleProvider.remove(req.params.id, function( err, result) {
      res.send('Library ' +req.param.id +' has been deleted.');
    });
  });

}

exports.init = init;
