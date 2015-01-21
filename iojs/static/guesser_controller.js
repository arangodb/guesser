var app = angular.module("guesser", []);

app.controller("guesserController", function ($scope, $http) {
  $scope.container = { "name": "" };

  $scope.restart = function () {
    $http.get("get/root")
      .success(function(response) {
                 $scope.current = response;
               })
      .error(function(response) {
               $scope.current = {};
               alert("AJAX call failed");
             });
      $scope.view = "welcome";
  }

  $scope.restart();

  $scope.update = function () {
    if (! $scope.current.isLeaf) {
      $scope.theQuestion = $scope.current.question;
      $scope.theAnswer1 = $scope.current.answer1;
      $scope.theAnswer2 = $scope.current.answer2;
      $scope.view = "question";
    }
    else {
      $scope.theGuess = $scope.current.guess;
      $scope.guessedRight = false;
      $scope.view = "guess";
    }
  }
  $scope.startGame = $scope.update;

  $scope.answer = function (newkey) {
    $http.get("get/"+newkey)
      .success(function(response) {
                 $scope.current = response;
                 $scope.update();
               })
      .error(function(response) {
               alert("AJAX call failed");
             });
  }

  $scope.yes = function () {
    $scope.guessedRight = true;
  }

  $scope.no = function () {
    $scope.oldThing = $scope.current.guess;
    $scope.submitted = false;
    $scope.view = "learning";
  }

  $scope.submit = function (userThing, userQuestion, answerOld, answerNew) {
    if (answerOld === answerNew) {
      alert("Old and new answer must be different");
      return;
    }
    if (userQuestion[userQuestion.length-1] !== "?") {
      userQuestion += "?";
    }
    var a = { oldLeaf: $scope.current._key,
              oldLeafRev: $scope.current._rev,
              newQuestion: {
                question: userQuestion,
                answer1:  answerOld,
                answer2:  answerNew,
                goto1:    $scope.current._key,
                isLeaf:   false
              },
              newLeaf: {
                isLeaf: true,
                guess: userThing
              }
            };
    $http.put("put", a)
      .success(function(response) {
                 if (response.error === true) {
                   alert("Could not submit new question! "+
                         "This leaf was already modified!");
                   $scope.restart();
                 }
                 else {
                   $scope.submitted = true;
                 }
               })
      .error(function(response) {
               alert("AJAX call failed, cannot update");
             });
  }
} );

