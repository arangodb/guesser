  "use strict";
  var console = require("console"),
      db = require("org/arangodb").db,
      collname = module.context.collectionName("questions");

  if (db._collection(collname) === null) {
    var c = db._create(collname);
    var q = c.insert({ isLeaf: false, question: "Is it a thing or an animal?",
                       answer1: "a thing", answer2: "an animal",
                       goto1: "computer", goto2: "cat", _key: "root",
                       parent: null});
    c.insert({ isLeaf: true, guess: "a computer",
               parent: q._key, _key: "computer" });
    c.insert({ isLeaf: true, guess: "a cat",
               parent: q._key, _key: "cat" });
  }
  else if (module.context.isProduction) {
    console.warn("collection '%s' already exists. Leaving it untouched.", collname);
  }
