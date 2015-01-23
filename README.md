# Building a self-learning game with ArangoDB, io.js/NodeJS & AngularJS in half a day. 

## Introduction and Overview

In this tutorial we want to illustrate a possible architecture of a web application using AngularJS for the frontend in the browser, io.js as application server and ArangoDB as backend database. We are particularly focusing on ArangoDB and its Foxx microservice framework, and only briefly show the io.js and AngularJS parts. In particular, this is not intended to be an AngularJS or io.js tutorial. We even use some shortcuts that one would usually not deploy in production to keep the app simple. Nevertheless, the architecture of the application is in principle suitable as a blueprint for an actual, larger web application.

We are using io.js in the example. However the project will work using node.js as well.

All necessary steps will be described in detail and you can follow the evolution of the system by looking at each stage without typing code yourself.

Our web application will be a guessing game, in which the computer tries to guess a thing or animal you think of by asking a series of questions, for which you provide the answers. Finally, the computer will try to guess what you thought of, if it is wrong, it tries to learn from the experience, such that it can be successful the next time round. If you want to give it a try, surf to

<http://guesser.9hoeffer.de:8000>

The data from this "machine learning" is kept persistent in the database. We use a single collection storing the questions as well as the guesses, which are organized in a binary tree. Each question node has a left and a right child for the two different answers, and each guess is a leaf in the tree. We do not use a graph data model for this since our queries will only be single document lookups.

During the game the app will simply follow one path in the tree from the root to a leaf, depending on the answers by the user. It will then try a guess, if this is not correct, it will ask the user to provide the right answer and a new question to distinguish that answer from the guess, and finally change the tree, completing the learning process.

The whole creation of the application works in ten basic steps:

1.  [Fork the `git` repository and checkout the initial step.][1]
2.  [Install application dependencies][2]
3.  [Create a minimal web server using the `npm` module `express` and serve a welcome view][3]
4.  [Install ArangoDB and set up a place for Foxx app development][4]
5.  [Create a minimal Foxx app for the database services][5]
6.  [Organize the setup and tear down: create a collection with initial data][6]
7.  [Create the question asking view][7]
8.  [Create the guessing view][8]
9.  [Create the learning view][9]
10. [Deploy the Foxx app in ArangoDB][10]

You will be able to follow the proceedings, because in the `git` repository that you clone in Step 1 there is a tag for the state after each of the 10 steps, such that you can look at all the code without typing a single line of source code. In the end you will be able to adapt the whole system easily to your own situation.

## The Creation

Please note that to be able to run the application at any step you will at least have to do "bower install" in iojs/static/ and "npm install" in iojs/. They will install external dependencies which are NOT contained in the repository.

### Prerequisites

#### Install io.js

Make sure you have io.js (or node.js) installed. We will refer to "iojs" throughout this tutorial. However if you rather want to use node just replace "iojs" with "node" in any commands.

To install io.js download the appropriate package for your operating system from

<http://iojs.org/>

and install it. We will assume that iojs will be in your $PATH for this tutorial.

#### Install bower

Bower will be used to manage the frontend dependencies.

Install it using "npm install -g bower". Depending on your system you might have to execute this using sudo (-g installs it globally on your system).

<a name="One"></a>

### 1\. Fork the git repository and checkout the initial step.

Simply do

    git clone https://github.com/ArangoDB/guesser.git
    cd guesser
    git checkout step1
    

This will create a directory `guesser` in your current directory and will checkout the state after Step 1, you will only see a license file and a `README.md`.

<a name="Two"></a>

### 2\. Install application dependencies

To create the io.js backend application

    mkdir iojs
    cd iojs
    npm init -y
    npm install --save express arangojs promise concat-stream
    mkdir static
    
The node package manager (npm) needs a file called `package.json` to work. This file is used to describe the project and its dependencies. We are using npms defaults during init to get the project running as quickly as possible. Have a look at [npm's documentation][11] for an in-depth explanation of the package format.

The install command downloaded all necessary dependencies to develop a base io.js web application which uses arangodb as a database.

We will put static content served by our io.js app in the `static` folder.

To manage our frontend dependencies we will be using bower.

Just as npm it has its own package format (on which we won't go into detail here).

Execute
    
    cd static
    bower init

This will create a bower.json package file in the static directory. For now don't bother about the details and simply press enter during the init wizard process. You should however check out [bowers documentation later][12].

To install AngularJS using bower execute:

    bower install --save angularjs

This will create a directory "bower_components" and angularjs should be installed there.

    git checkout step2
    
to see the state of our project after this step. Note that if you actually performed the commands in this step, then the `git checkout step2` will complain that it cannot overwrite some files. Simply delete them and do the `git checkout step2` again.

<a name="Three"></a>

### 3\. Create a minimal web server using the `npm` module `express` and serve a welcome view

We are now in a position to create a minimal web server serving some static content showing a welcome view. To this end, we create the files

    iojs/guesser_server.js
    iojs/static/index.html
    iojs/static/base.css
    iojs/static/guesser_controller.js
    

The guesser server is an io.js application using the `express` package to serve some static pages for now. See the [AngularJS][13] and [express][14] manuals for explanations. Here it shall suffice to say that the file `index.html` contains the HTML for the single page, it includes the CSS style sheet `base.css`, the AngularJS library file `angular.min.js` and the controller file `guesser_controller.js`. The latter contains the JavaScript code that is executed in the web browser to take care of the actual user interface, and later to perform AJAX calls back to the io.js server.

Use

    git checkout step3
    

to see the state of our project after this step. After this, you can simply execute

    cd iojs
    iojs guesser_server.js
    

to start a web server on `port 8000` of your local machine. If you visit

[http://localhost:8000/][15]

(replace `localhost` by the name or IP address of your server if you try this on a remote machine), you should see the starting page with a blue background and a single input field for your name. The button will not yet respond.

To get a feeling of how easy it is to configure an `express` server, here is the code that organizes the delivery of a single static page:

    var express = require('express');
    var app = express();
    app.use(express.static(__dirname + "/static"));

and here is the code that creates the actual web server:

    var server = app.listen(8000, function () {
      var host = server.address().address
      var port = server.address().port
      console.log('Guesser app server listening at http://%s:%s', host, port)
    });
    

The HTML page is a standard one with a few AngularJS directives, the AngularJS controller is as yet only a stub.

<a name="Four"></a>

### 4\. Install ArangoDB and set up a place for Foxx app development

Download and install ArangoDB as described on the page

<https://www.arangodb.com/download>

To setup a place to develop a Foxx app, simply create a directory hierarchy like the following anywhere in you file system:

    mkdir apps # this is now our <PATH_TO_YOUR_apps_DIR>
    cd apps
    mkdir -p databases/_system
    

and either put the `guesser` repository in the `_system` folder or create a symbolic link by

    ln -s <PATH_TO_guesser_DIR> <PATH_TO_YOUR_apps_DIR>/databases/_system/guesser
    

Finally, edit the ArangoDB configuration file `arangod.conf` (which usually resides in `/etc/arangodb/arangod.conf`) and add a line

    dev-app-path = <PATH_TO_YOUR_apps_DIR>
    

in the `javascript` section. Restart ArangoDB after this change, on Linux, for example, you do

    sudo service arangodb restart
    

for this. Use

    git checkout step4
    

to see the state of our project after this step, note that nothing in the project has changed for this step.

***Note*: You can also start arangodb with a custom dev-app-path by invoking `arangod --javascript.dev-app-path=<PATH_TO_YOUR_apps_DIR>`.

<a name="Five"></a>

### 5\. Create a minimal Foxx app for the database services

We create the files

    manifest.json
    guesser.js

Use

    git checkout step5
    

to see the state of our project after this step. The file `manifest.json` is the starting point for any Foxx app. It contains version, author, license and repository information, and tells ArangoDB what other files are relevant. Here, we install a "controller" in the form of the file `guesser.js`. It is responsible to define new HTTP routes and contains the JavaScript code to be executed for them. In this step, we define a single new route `/hello` and install an HTTP `GET` method for it that simply serves a constant JSON document.

This is achieved by the following code in `guesser.js`:

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
    

This initializes the controller and installs a single route for an `HTTP GET` request. You can test this route by pointing your browser to

<http://localhost:8529/dev/guesser/hello>

You should see a single JSON document like this:

    { "Hello": "world" }
    

If this does not work right away, you might want to try to restart the database server using

    sudo service arangodb restart

as before, since then ArangoDB will discover your Foxx app for the first time. Also make sure <PATH_TO_YOUR_apps_DIR> in your config is correct. A symbolic link databases/_system/guesser pointing to your guesser project directory containing the manifest.json should be available there.

Note that so far ArangoDB serves your Foxx app in the development mode, which means that for each request all necessary files are read in from scratch and you do not have to restart every time. We will later see how to switch this off for production use.

<a name="Six"></a>

### 6\. Organize the setup and tear down: create a collection with initial data

In this step we create the files

    scripts/setup.js
    scripts/teardown.js
    

to create a collection in the database and fill it with initial data, when the Foxx app is installed. Use

    git checkout step6
    

to see the state of our project after this step. We install setup and teardown scripts in the manifest file, these are executed when the Foxx app is installed and deinstalled respectively. We create a single collection, note that we are using a mechanism in the Foxx application context to derive a name for the collection that is specific for this app by doing

    var collname = applicationContext.collectionName("questions");
    

Obviously, because Foxx controllers run in the database server, we have direct, high-performance access to the data. In the setup script we also create the first three documents in the `questions` collection. They make a small binary tree with one internal node and two leaves.

To trigger the execution of the `setup.js` script, just reload the above page

<http://localhost:8529/dev/guesser/hello>

After that, point your browser to

<http://localhost:8529>

and choose the tab `Collections` to inspect the contents of the newly created collection with the name `dev_guesser_questions`. In the root node, you see a question and in the two leaves you see two guesses.

<a name="Seven"></a>

### 7\. Create the question asking view

It is now time to add the main view to our io.js app, namely the one that asks a question. To this end, we edit the files

    iojs/static/index.html
    iojs/static/guesser_controller.js
    iojs/guesser_server.js
    

Use

    git checkout step7
    

to see the state of our project after this step.

In the first we simply add a new `div` tag with a different condition using the `ng-switch-when` attribute (see the AngularJS documentation for an explanation). The scope variable "view" will serve as a simple router variable here. Furthermore, we add a few click actions, which are implemented in the file `guesser_controller.js`. The `restart()` function there does an AJAX call to our io.js server getting the root document of the tree via the route `/get/root`. The `update()` function updates the variables in `$scope` to configure the question asking view. Finally, the `answer(newkey)` function performs a step in the search tree by asking for another document to be fetched, again with an AJAX call. This is all standard AngularJS with AJAX calls, so we do not show the code here.

***Note*: In the AngularJS application we are creating our own, simple routing. AngularJS provides a built-in routing module and there are also third party routers available. We are using a simple self made routing system to keep things simple as we won't need many routes.

The service in the io.js server is implemented in the file `guesser_server.js`, which is executed by io.js. We simply have to add a callback under the route `/get/:key`, where the `:key` is a placeholder for any string. In this callback we use the standard ArangoDB API and the `JavaScript/io.js/node.js` driver to fetch a certain document. The result is returned as HTTP response.

At this stage the game is nearly working, it asks questions. However, the view for the guesses is not yet done, so we will create his in the next step. To try out what we have so far, start the io.js server with

    cd iojs
    iojs guesser_server.js
    

and then point your browser to

[http://localhost:8000/][15]

<a name="Eight"></a>

### 8\. Create the guessing view

This is now rather straightforward, we simply change the files

    iojs/static/index.html
    iojs/static/guesser_controller.js
    

Use

    git checkout step8
    

to see the state of our project after this step. We have another view, controlled by another value of our handcrafted `$scope.view` router variable. We implement one more controller click action, namely the `yes()` function, which simply shows a short statement with a link back to the beginning. You can try the app again as before, only the "No" button in the end does not yet work.

<a name="Nine"></a>

### 9\. Create the learning view

Finally, we have to create the view with which the computer can learn. This is the most interesting one, it needs support in the following files:

    iojs/static/index.html
    iojs/static/guesser_controller.js
    iojs/guesser_server.js
    guesser.js
    

which covers the whole supply chain of our app. Use

    git checkout step9
    

to see the state of our project after this step.

As usual, we add a new view in the file `index.html`, and it is backed by two click actions in `guesser_controller.js` in form of the `no()` and `submit()` functions. The former simply switches the view to the learning view, filling in some data in the browser variables. The user can then enter what s/he had thought of, a question to distinguish it from the last guess and the two possible answers. After clicking on `Submit` the `submit()` function is called. After some checks, it essentially puts together a single JSON as input for an HTTP `PUT` AJAX request that changes the guessing tree as described above. This AJAX call is implemented in the io.js server in `guesser_server.js`.

We could have implemented this call using the standard database API and the ArangoDB driver. However, we wanted to illustrate the concept of additional user defined services implemented in the database server, which is the whole point of the Foxx framework. Therefore, the io.js server only implements a very short trampoline function and simply forwards the `PUT` request to the Foxx app. Here is the code:

    // This is just a trampoline to the Foxx app:
    var ep = db.endpoint();
    app.put("/put", function (req, res) {
        req.pipe(concat( function(body) {
            // check out body-parser for an express middleware which 
            // handles json automatically
            ep.put("/dev/guesser/put", JSON.parse(body.toString()),
                function(err, x) {
                    if (err) {
                        err.error = true;
                        res.send(err);
                    }   
                    else {
                        res.send(x);
                    }   
                }); 
        })); 
    });
 

The actual implementation of this `PUT` request is then in `guesser.js` in the Foxx app, which is a bit longer.

The callback function for the `/put` route simply executes a transaction on the database, changing the tree in one go. This is crucial to ensure that the data structure is never corrupted. We use a transaction, because this guarantees atomic and isolated operation for all manipulations. Furthermore, we check that the current revision of the leaf node is still the same as when we fetched it from the database. This ensures that the change can only go through if nobody else changed the tree in this place in the meantime. Here is the code from `guesser/guesser.js`:

    controller.put('/put', function (req, res) {
      log("put called");
      var db = require("internal").db;
      var b = req.body();
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
    });
    

The game is now fully functional and playing it will actually increase the tree and thus the knowledge of the game.

For illustration purposes, we have additionally implemented a `GET` method in the Foxx app, which is currently unused. One could exchange the `/get/:key` callback in `guesser_server.js` by a trampoline similar to the one for the `/put` callback. Then one could add more schema validation and enforcement in the Foxx app and completely switch off the standard API, thereby increasing security and correctness.

<a name="Ten"></a>

### 10\. Deploy the Foxx app in ArangoDB

Now that the application works, it is time to switch off the development mode and deploy the Foxx app in ArangoDB for production. This is fortunately very easy, and there are several methods available. First of all, remove the entry

    dev-app-path = <PATH_TO_YOUR_apps_DIR>
    

in `arangod.conf` again and restart the ArangoDB server:

    sudo service arangodb restart
    
We first describe the open source method using a public `github`
repository.  Since the whole Foxx app resides in a `github` repository, you can simply point your browser to

<http://localhost:8529>

choose the "Applications" tab and click on the big `Add Application` button. Use the `github` tab and enter `ArangoDB/guesser` under "Repository", leave `master` under "Version". After you click "Install" you are prompted for a mount point, choose `/guesser` and click "Configure". After that, the "guesser" app should appear under "Applications". You can test whether or not this worked by pointing your browser to

<http://localhost:8529/guesser/get/root>

which should give you the initial question as a JSON document. 

If you do not keep your Foxx app in a public github repository then you can also deploy it using a local zip file. Create a zip archive of the guesser repository that contains the folder `guesser` on the top level and upload it using the zip tab behind the `Add Application` button described above.

Regardless of which deployment method you used, you now have to adjust the file

    iojs/guesser_server.js
    

in two places: one is the name of the collection, which is now `guesser_questions` rather than `dev_guesser_questions`. The second place is the route of the Foxx `PUT` request which is now `/guesser/put` rather than `/dev/guesser/put`. As a best practive we can leverage the `env` variable of express which defaults to `development` and can be controlled by invoking io.js like this: ``NODE_ENV=production iojs guesser_server.js``

Use

    git checkout step10
    

to see the state of our project after this step.

<a name="Eleven"></a>

## Deployment in production

All that is needed to deploy our app for production is the following:

 1. Install io.js, npm and ArangoDB as described above in Steps 2 and 4 (leave out the part about the ArangoDB development mode)
 2. Deploy the Foxx app as described in Step 10.
 3. Install frontend and backend dependencies as described in Step 2.
 4. Deploy the io.js application together with the static web content.
 
To simplify the fourth step we have already provided the necessary
entries in `package.json` to publish the whole io.js app as an `npm`
module. Since we have done `npm publish` you can now simply do `npm
install guesser` and get the production ready app with all dependencies.
To get an idea what is necessary to achieve this, use

    git checkout step11

We have also set up an infrastructure to deploy the whole app as [Docker
containers][16]. We do not describe this here, but you can see the
necessary files by doing

    git checkout step12

and read about the details in [this recipe in the ArangoDB Cookbook][17].

## Architectural considerations

We would like to point out that although this is a nearly minimal application without sophisticated error handling, security measures and web prettiness, it nevertheless has all architectural features of a proper web application. There is a clear separation of the persistence layer and the application server, the web client in the browser only talks to the io.js server and not directly to the database. All interfaces are well-defined and use HTTP.

Therefore, it is in principle possible to exchange any of the three parts and replace it with another technology. In an upcoming post I will for example explain how to replace the io.js middleware by an approach using a classical web server and PHP. Obviously, the front end code works in different browsers and it would be relatively simple to write an app for a mobile device replacing the browser part.

This separation helps also with the scalability, because one can scale the database layer independently from the application server layer. If many requests are coming in, one can easily deploy multiple io.js servers and put a load balancer in front of them. Since they are stateless, this allows for extremely easy and fast scalability. If the requests to the database are the bottleneck, one can start to use sharding and scale the persistence layer up as needed.

From a security perspective, the whole setup is quite satisfactory, since all accesses to the database are via two well-defined routes, which would actually allow to switch off the standard API of the database for increased security. This way, the amount of code one would have to scrutinize is very small.

However we made a few shortcuts in the application structure: You probably don't want to put the bower.json directly into static directory (needs a .bowerrc to work) or you would implement a build process which removes the file in production.

## Authors

This tutorial and the corresponding code base was written by Max
Neunhöffer [neunhoef](https://github.com/neunhoef) and 
Andreas Streichardt [m0ppers](https://github.com/m0ppers).

## License

This code is distributed under the 
[Apache License](http://www.apache.org/licenses/LICENSE-2.0).

 [1]: #One
 [2]: #Two
 [3]: #Three
 [4]: #Four
 [5]: #Five
 [6]: #Six
 [7]: #Seven
 [8]: #Eight
 [9]: #Nine
 [10]: #Ten
 [11]: https://docs.npmjs.com/
 [12]: http://bower.io/
 [13]: https://docs.angularjs.org/api
 [14]: http://expressjs.com/4x/api.html
 [15]: http://localhost:8000
 [16]: https://www.docker.com/
 [17]: https://docs.arangodb.com/cookbook/UsingArangoDBNodeJSDocker.html
