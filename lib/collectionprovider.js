// http://coenraets.org/blog/2012/10/creating-a-rest-api-using-node-js-express-and-mongodb/

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSONPure;
var ObjectID = require('mongodb').ObjectID;

CollectionProvider = function(collectionId, host, port) {
  this.collectionId = collectionId;
  this.db= new Db(
    'mvt-test',
    new Server(host, port, {auto_reconnect: true }, {}),
    { safe: false }
  );
  this.db.open(function(){});
};

CollectionProvider.prototype.getCollection= function(callback) {
  this.db.collection(this.collectionId, {safe: true}, function(error, collection) {
    if( error ) callback(error);
    else callback(null, collection);
  });
};

CollectionProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, collection) {
      if( error ) callback(error)
      else {
        collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};


CollectionProvider.prototype.findOne = function(query, callback) {
    this.getCollection(function(error, collection) {
      if( error ) callback(error)
      else {
        collection.findOne(query, {safe: true}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};
CollectionProvider.prototype.findById = function(id, callback) {
    this.findOne({id: id}, callback);
};

CollectionProvider.prototype.findByInternalId = function(id, callback) {
    this.getCollection(function(error, collection) {
      if( error ) callback(error)
      else {
        collection.findOne({_id: new BSON.ObjectID(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

CollectionProvider.prototype.save = function(documents, callback) {
    this.getCollection(function(error, collection) {
      if( error ) callback(error)
      else {
        if( typeof(documents.length)=="undefined")
          documents = [documents];

        var document;
        for( var i =0;i< documents.length;i++ ) {
          document = documents[i];
          document.created_at = new Date();
        }

        collection.insert(documents, {safe: true}, function() {
          callback(null, documents);
        });
      }
    });
};

CollectionProvider.prototype.update = function(query, data, callback) {
    this.getCollection(function(error, collection) {
      if( error ) callback(error)
      else {
        data.modified_at = new Date();
        collection.update(query, data, {safe: true}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};
CollectionProvider.prototype.updateById = function(id, data, callback) {
    this.update({id: id}, data, callback);
};
CollectionProvider.prototype.updateByInternalId = function(id, data, callback) {
    // mongo does not allow put with an _id
    // backbone requires an _id
    if (data._id) {
      delete data._id;
    }
    this.update({_id: new BSON.ObjectID(id)}, data, callback);
};

CollectionProvider.prototype.remove = function(id, callback) {
    this.getCollection(function(error, collection) {
      if( error ) callback(error)
      else {
        collection.remove({_id: collection.db.bson_serializer.ObjectID.createFromHexString(id)}, 
          { safe: true },
          function(error, result) {
            if( error ) callback(error)
            else callback(null, result)
          }
        );
      }
    });
};

exports.CollectionProvider = CollectionProvider;
