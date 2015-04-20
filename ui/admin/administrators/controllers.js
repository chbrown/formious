/*jslint browser: true */ /*globals app, summarizeResponse */

app.controller('admin.administrators.table', function($scope, $flash, Administrator) {
  $scope.administrators = Administrator.query();
  $scope.delete = function(administrator) {
    var promise = administrator.$delete().then(function() {
      $scope.administrators.splice($scope.administrators.indexOf(administrator), 1);
      return 'Deleted';
    }, summarizeResponse);
    $flash(promise);
  };
});

app.controller('admin.administrators.edit', function($scope, $http, $flash, $window, $stateParams,
    Administrator, AWSAccount, AWSAccountAdministrator) {
  $scope.administrator = Administrator.get($stateParams);

  var administrator_id = $stateParams.id;
  $scope.aws_accounts = AWSAccount.query();
  $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});

  $scope.sync = function() {
    var promise = $scope.administrator.$save().then(function() {
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.$on('save', $scope.sync);

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
