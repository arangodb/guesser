var app = angular.module("guesser", []);

app.controller("guesserController", function ($scope, $http) {
  $scope.container = {"name":  ""};
  $scope.view = "welcome";
});

