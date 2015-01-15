(function() {
  "use strict";

  var db = require("org/arangodb").db,
      collname = applicationContext.collectionName("questions"),
      collection = db._collection(collname);

  if (collection !== null) {
    collection.drop();
  }
}());
