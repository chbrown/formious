/*jslint browser: true, devel: true */ /*globals _, app, Url, summarizeResponse */

app.controller('adminAdministratorsCtrl', function($scope, $flash, Administrator) {
  $scope.administrators = Administrator.query();
  $scope.delete = function(administrator) {
    var promise = administrator.$delete().then(function() {
      $scope.administrators.splice($scope.administrators.indexOf(administrator), 1);
      return 'Deleted';
    }, summarizeResponse);
    $flash(promise);
  };
});

app.controller('adminAdministratorCtrl', function($scope, $http, $flash, $window, $stateParams,
    Administrator, AWSAccount, AWSAccountAdministrator) {
  $scope.administrator = Administrator.get($stateParams);

  var administrator_id = $stateParams.id;
  $scope.aws_accounts = AWSAccount.query();
  $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});

  $scope.sync = function() {
    var promise = $scope.administrator.$save().then(function(res) {
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.unlinkAWSAccount = function(account) {
    account.$delete(function() {
      $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
    });
  };

  $scope.linkAWSAccount = function(account) {
    var administrator_aws_account = new AWSAccountAdministrator(account);
    administrator_aws_account.administrator_id = $scope.administrator.id;

    var promise = administrator_aws_account.$save(function() {
      $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
    }).then(function() {
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };
});
