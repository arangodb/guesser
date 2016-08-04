////////////////////////////////////////////////////////////////////////////////
/// A learning guessing game
/// by Max Neunhöffer
/// Copyright 2014, ArangoDB GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////


'use strict';
const createRouter = require('org/arangodb/foxx/router');
const router = createRouter();

module.context.use(router);
const log = require("console").log;
  
const applicationContext = module.context;

var collName = applicationContext.collectionName("questions");
var coll = applicationContext.collection("questions");

// Get an entry:
router.get('/get/:key', function (req, res) {
  log("get/"+req.pathParams["key"]+" called");
  var d;
  try {
    d = coll.document(req.pathParams["key"]);
    res.json(d);
  }
  catch (e) {
    res.json(e);
  }
});
// Post a new question and thingy:
router.put('/put', function (req, res) {
  log("put called");
  var db = require("internal").db;
  var b = req.body;
  try {
    db._executeTransaction( {
      collections: {
        write: [collName]
      },
      action: function () {
        var oldLeaf = coll.document(b.oldLeaf);
        if (oldLeaf._rev !== b.oldLeafRev) {
          log("Leaf was already changed!");
          throw {"error":true, "errorMessage": "Leaf was already changed"};
        }
        var oldParent = coll.document(oldLeaf.parent);
        b.newQuestion.parent = oldLeaf.parent;
        var newQuestion = coll.insert(b.newQuestion);
        b.newLeaf.parent = newQuestion._key;
        var newLeaf = coll.insert(b.newLeaf);
        coll.update(newQuestion._key, { goto2: newLeaf._key });
        coll.update(oldLeaf._key, {parent: newQuestion._key});
        if (oldParent.goto1 === b.oldLeaf) {
          coll.update(oldParent._key, { goto1: newQuestion._key });
        }
        else if (oldParent.goto2 === b.oldLeaf) {
          coll.update(oldParent._key, { goto2: newQuestion._key });
        }
        else {
          throw "Murks";
        }
      },
    });
  }
  catch (e) {
    res.json(e);
    return;
  }
  res.json({"error":false});
})
.body(['json']); 

