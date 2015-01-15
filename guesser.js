////////////////////////////////////////////////////////////////////////////////
/// A learning guessing game
/// by Max Neunhöffer
/// Copyright 2014, ArangoDB GmbH, Cologne, Germany
////////////////////////////////////////////////////////////////////////////////

(function () {
  "use strict";
  var Foxx = require("org/arangodb/foxx"),
      log = require("console").log,
      controller = new Foxx.Controller(applicationContext);

  // Example route:
  controller.get('/hello', function (req, res) {
    res.json({"Hello": "world"});
  });

}());

