function init(app) {

  var CollectionProvider = require('../lib/collectionprovider').CollectionProvider;
  var userProvider= new CollectionProvider('users', 'localhost', 27017);
  var impressionProvider = new CollectionProvider('impressions', 'localhost', 27017);
  var articleProvider = new CollectionProvider('articles', 'localhost', 27017);

  app.get('/users/:id', function(req, res){
    getImpressionsByUserId(req.params.id, function(impressions) {
      getCategoriesByImpressions(impressions, function(categories){
        getUserFeed(categories, function(relevance, highlights, articles){
            return res.send({
              relevance: relevance,
              categories: categories,
              highlights: highlights,
              articles: articles
            });
        });
      });
    });
  });

  function getMaxViews(categories) {
    var maxViews = 0
      , categoryKey
      , sectionKey;

    for (categoryKey in categories) {
      for (sectionKey in categories[categoryKey].sections) {
        if (maxViews < categories[categoryKey].sections[sectionKey]) {
          maxViews = categories[categoryKey].sections[sectionKey];
        }
      }
    }
    return maxViews;
  };

  function getRelevance(article, categories, maxViews) {
    var relevance = 0
      , views;
    if (article.section) {
      views = getSectionViews(article.section, categories);
    }
    return Number((views/maxViews).toFixed(3));
  };

  function getSectionViews(section, categories) {
    var categoryKey
      , sectionKey;

    for (categoryKey in categories) {
      for (sectionKey in categories[categoryKey].sections) {
        if (section === sectionKey) {
          return categories[categoryKey].sections[sectionKey];
        }
      }
    }
    return 0;
  };

  function sortArticlesByDate(articles) {
    articles.sort(function(a, b){
      if (a.date < b.date) return 1;
      else if (a.date === b.date) return 0
      else return -1;
    });
  };
  function sortArticlesByRelevance(articles) {
    articles.sort(function(a, b){
      if (a.relevance < b.relevance) return 1;
      else if (a.relevance === b.relevance) return 0
      else return -1;
    });
  };

  function getArticlesInSections(articles, sections) {
    var result = {};
    articles.forEach(function(article){
      if (article.section) {
        if (-1 !== sections.indexOf(article.section)) {
          if (!result[article.section]) result[article.section] = [];
          result[article.section].push(article);
        }
      }
    });
    return result;
  };

  function getSectionsByViews(categories) {
    var categoryKey
      , sectionKey
      , views = []
      , sections = [];

    for (categoryKey in categories) {
      for (sectionKey in categories[categoryKey].sections) {
        views.push({
          section: sectionKey,
          views: categories[categoryKey].sections[sectionKey]
        });
      }
    }
    views.sort(function(a, b){
      if (a.views < b.views) return 1;
      else if (a.views === b.views) return 0
      else return -1;
    });
    views.forEach(function(view){
      sections.push(view.section);
    });
    return sections;
  };

  function getUserFeed(categories, callback) {
    var articles = []
      , noOfArticlesLoading = 0;

    function processArticles(articles) {
      var relevance = {min: false, max: 0}
        , maxViews = getMaxViews(categories)
        , tempArticles = []
        , sections
        , isInHighlights
        , highlightSections = []
        , highlights = []
        , index;

      // add date and relevance score
      articles.forEach(function(article){
        article.date = new Date(article.date)
        article.relevance = getRelevance(article, categories, maxViews);
        if (false === relevance.min || relevance.min > article.relevance) relevance.min = article.relevance;
        if (relevance.max < article.relevance) relevance.max = article.relevance;
      });

      // get highlights

      // get top 5 sections
      highlightSections = getSectionsByViews(categories);
      // get articles in those sections
      sections = getArticlesInSections(articles, highlightSections);
      // get most recent articles in sections
      for (index in sections) {
        sortArticlesByDate(sections[index]);
        highlights.push(sections[index][0]);
      }
      sortArticlesByRelevance(highlights);
      highlights = highlights.slice(0, 6);

      // remove highlights from articles
      articles.forEach(function(article){
        isInHighlights = false;
        highlights.forEach(function(highlight){
          if (article.guid === highlight.guid) {
            isInHighlights = true;
          }
        });
        if (!isInHighlights) {
          tempArticles.push(article);
        }
      });
      articles = tempArticles;

      // sort articles by date
      sortArticlesByDate(articles);

      callback(relevance, highlights, articles);
    };

    function articlesLoaded(result) {
      if (false !== result) {
        articles = articles.concat(result);
      }
      noOfArticlesLoading--;

      if (0 === noOfArticlesLoading) {
        processArticles(articles);
      }
    };

    for (productKey in categories) {
      noOfArticlesLoading++;
      getArticlesByProduct(productKey, categories[productKey].sections, function(result) {
        articlesLoaded(result);
      });
    }
  };

  function getArticlesByProduct(productId, sections, callback) {
    var sectionKey
      , options = {product: productId}
      , sectionOptions = [];

    if (sections) {
      for (sectionKey in sections) {
        sectionOptions.push(sectionKey);
      }
    }
    if (sectionOptions.length) {
      options.section = {$in: sectionOptions};
    }
console.log('options', options);
    articleProvider.findByObject(options, function(err, result){
      if (!err) {
        callback(result);
      } else {
        callback([]);
      }
    });
  };

  function getImpressionsByUserId(userId, callback) {
    var options = {userId: userId};
    impressionProvider.findByObject(options, function(err, result){
      if (!err) {
        callback(result);
      } else {
        callback([]);
      }
    });
  };

  function incCategory(product, category) {
    if (undefined === product.sections[category]) {
      product.sections[category]=1;
    } else {
      product.sections[category]++;
    }
  };

  function handleSportPath(product, parts) {
    var index
      , part;

    function handleTeamPath(sport, team) {
      if (!product.teams) {
        product.teams = {};
      }
      if (!product.teams[sport]) {
        product.teams[sport] = {};
      }
      if (!product.teams[sport][team]) {
        product.teams[sport][team] = 1;
      } else {
        product.teams[sport][team]++;
      }
    };

    incCategory(product, parts[1]);

    if ('teams' === parts[2] && parts.length >= 4) {
      incCategory(product, parts[3]); 
      handleTeamPath(parts[1], parts[3]);
    }
  };

  function getCategoriesByImpressions(impresssions, callback) {
    var categories = {}
      , parts
      , product
      , productSection
      , articleParts
      , index;

    impresssions.forEach(function(impression) {
      parts = impression.url.replace('0/', '').split('/').slice(1);
      product = parts[0];
      if ('' === product) product = 'homepage';
      if (!categories[product]) {
        categories[product] = {
          views: 1,
          sections: {}
        };
      } else {
        categories[product].views++;
      }
      if (3 <= parts.length && undefined !== parts[1] && '' !== parts[1]) {
        if ('sport' === product) {
          handleSportPath(categories[product], parts);
        } else {
          incCategory(categories[product], parts[1]);
        }
      } else if ('news' === product && 2 <= parts.length) {
        articleParts = parts[1].split('-');
        for(index=0; index<articleParts.length-1; index++) {
          incCategory(categories[product], articleParts[index]); 
        }
      }
    });
    callback(categories);
  };

};

exports.init = init;
