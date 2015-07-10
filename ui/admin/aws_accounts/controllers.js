/*jslint esnext: true */
import {app} from '../app';

app
.controller('admin.aws_accounts.table', function($scope, AWSAccount) {
  $scope.aws_accounts = AWSAccount.query();
  $scope.delete = function(aws_account) {
    aws_account.$delete(function() {
      $scope.aws_accounts = AWSAccount.query();
    });
  };
})
.controller('admin.aws_accounts.edit', function($scope, $http, $turk, $flash, $stateParams, AWSAccount) {
  $scope.environments = [{name: 'production'}, {name: 'sandbox'}];
  $scope.aws_account = AWSAccount.get($stateParams, function() {
    if ($scope.aws_account.id && $scope.aws_account.id != 'new') {
      $scope.environments.forEach(function(environment) {
        $turk({
          Operation: 'GetAccountBalance',
        }).then(function(document) {
          environment.account_balance = document.querySelector('FormattedPrice').textContent;
        });
      });
    }
  });

  $scope.sync = function() {
    var promise = $scope.aws_account.$save().then(function() {
      return 'Saved';
    });
    $flash(promise);
  };

  $scope.$on('save', $scope.sync);
});
