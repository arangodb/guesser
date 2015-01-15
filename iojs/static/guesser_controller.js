var app = angular.module("guesser", []);

app.controller("guesserController", function ($scope, $http) {
  $scope.name = "";
  $scope.view = "welcome";
});

