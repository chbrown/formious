/*jslint browser: true, devel: true */ /*globals _, app, Url, summarizeResponse */

app.controller('adminAdministratorsCtrl', function($scope, Administrator) {
  $scope.administrators = Administrator.query();
  $scope.delete = function(administrator) {
    administrator.$delete(function() {
      $scope.administrators = Administrator.query();
    });
  };
});

app.controller('adminAdministratorCtrl', function($scope, $http, $flash, $window,
    Administrator, AWSAccount, AWSAccountAdministrator) {
  var current_url = Url.parse($window.location);
  var administrator_id = _.last(current_url.path.split('/'));

  $scope.administrator = Administrator.get({id: administrator_id});
  $scope.aws_accounts = AWSAccount.query();
  $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});

  $scope.sync = function() {
    var promise = $scope.administrator.$save().then(function(res) {
      return 'Saved';
    }, summarizeResponse);
    $flash.addPromise(promise);
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
    $flash.addPromise(promise);
  };
});
