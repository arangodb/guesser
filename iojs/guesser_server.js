#!/usr/bin/env nodejs

////////////////////////////////////////////////////////////////////////////////
/// Libraries and database driver
////////////////////////////////////////////////////////////////////////////////

var fs = require("fs");
var Promise = require("promise");
var concat = require("concat-stream");

var Database = require("arangojs");
var db = new Database("http://localhost:8529");          // configure server

////////////////////////////////////////////////////////////////////////////////
/// An express app:
////////////////////////////////////////////////////////////////////////////////

var express = require('express');
var app = express();

// leverage NODE_ENV to determine collectionName
var collectionName = "guesser_questions";            // configure collection
var putRoute = "guesser";
if (app.get('env') == "development") {
    putRoute = "dev/" + putRoute;
    collectionName = "dev_" + collectionName;
}

var collectionPromise = new Promise(function(resolve, reject) {
    db.collection(collectionName, false, function(err, res) {
        if (err) {
            reject(err);
        }
        else {
            resolve(res);
        }
    });
});
collectionPromise.then(null, function(err) {
    console.log("Cannot contact the database! Terminating...");
    process.exit(1);
});

////////////////////////////////////////////////////////////////////////////////
/// Static content:
////////////////////////////////////////////////////////////////////////////////

app.use(express.static(__dirname + "/static"));

////////////////////////////////////////////////////////////////////////////////
/// AJAX services:
////////////////////////////////////////////////////////////////////////////////

app.get("/get/:key", function (req, res) {
  var key = req.params["key"];
  collectionPromise.then(function(collection) {
      collection.document(key, function(err, x) {
          if (err) {
              // for production we should implement more sophisticated handling here. Like logging where appropriate etc.
              res.status(err.code);
              delete err.response;
              res.json(err);
          }
          else {
              res.json(x);
          }
      });
  }, null);  // if this were rejected, we would be out already
});

// This is just a trampoline to the Foxx app:
var ep = db.route(putRoute);
app.put("/put", function (req, res) {
  req.pipe(concat( function(body) {
    // check out body-parser for a express middleware which handles json automatically
    ep.put("put", JSON.parse(body.toString()),
      function(err, x) {
        if (err) {
          err.error = true;
          delete err.response;
          res.send(err);
        }
        else {
          res.send(x.body);
        }
      });
  } ));
});

////////////////////////////////////////////////////////////////////////////////
/// Now finally make the server:
////////////////////////////////////////////////////////////////////////////////

var server = app.listen(8000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log('Guesser app server listening at http://%s:%s', host, port)
});
