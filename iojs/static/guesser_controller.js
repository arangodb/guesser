var app = angular.module("guesser", []);

app.controller("guesserController", function ($scope, $http) {
  $scope.container = {"name":  ""};
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


});
