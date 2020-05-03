/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;  

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      MongoClient.connect(MONGODB_CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
        
        let db = client.db('library'); // necessary instruction with mongodb v3.5.7!
        
        var collection = db.collection('books');
        collection.find({}).toArray().then(data => {
          let returnedData = [...data],
              commentcount;
          returnedData.forEach(item => {
            item.commentcount = item.comments.length
            delete item.comments
          })
          res.json(returnedData)
        })
      })
      // collection.find() returns a Cursor
      // I then convert it into an array thanks to the 'toArray()' method, applied to a Cursor
      // I had to invoke 'then', otherwise it would be a pending Promise...
    })
    
    .post(function (req, res){
      var title = req.body.title;
      if(title == '') {
        return res.send('There should be a title')
      }
      var book = {
        title: title,
        comments: []
      }
      MongoClient.connect(MONGODB_CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
        let db = client.db('library');
        
        var collection = db.collection('books');
        collection.insertOne(book, function(err, data) {
          res.send({title: title, _id: data.insertedId});           
        });
      })
    })
    
    .delete(function(req, res){
      MongoClient.connect(MONGODB_CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
        let db = client.db('library');
        
        var collection = db.collection('books');
        collection.deleteMany({}, function(err, data) {
          res.send('complete delete successful');           
        });
      })
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid;
      try {
        bookid = ObjectId(req.params.id)
      }
      catch(error){
        return res.send('invalid Id...');
      }
      MongoClient.connect(MONGODB_CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
        let db = client.db('library');
        
        var collection = db.collection('books');
        collection
          .find({_id: bookid})
          .toArray().then(data => {
            if (Object.keys(data).length == 0) {
              return res.send('no book exists')
            }
            res.json(data)
          })           
        });
      })      
    
    .post(function(req, res){
      var bookid = ObjectId(req.params.id);
      var comment = req.body.comment;
      MongoClient.connect(MONGODB_CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
        let db = client.db('library');
        
        var collection = db.collection('books');
        collection.updateOne({_id: bookid}, {$push: {comments: comment}})
          // Since we can't directly retrieve the updated document with 'updateOne',
          // we'll find the updated document with 'find' and the same filter ({_id: bookid})
        .then(e => {
          collection
          .find({_id: bookid})
          .toArray().then(data => {
            res.json(data);                     
          })
        })
        })
      })
    
    .delete(function(req, res){
      var bookid = ObjectId(req.params.id);
      MongoClient.connect(MONGODB_CONNECTION_STRING, { useUnifiedTopology: true }, function(err, client) {
        let db = client.db('library');
        
        var collection = db.collection('books');
        collection.deleteOne({_id: bookid}, function(err, book) {
          res.send('delete successful');                     
        })
      })
    });
  
};
