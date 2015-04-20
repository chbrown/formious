/*jslint browser: true */ /*globals app, summarizeResponse */

app.controller('admin.aws_accounts.table', function($scope, AWSAccount) {
  $scope.aws_accounts = AWSAccount.query();
  $scope.delete = function(aws_account) {
    aws_account.$delete(function() {
      $scope.aws_accounts = AWSAccount.query();
    });
  };
});

app.controller('admin.aws_accounts.edit', function($scope, $http, $xml, $flash, $stateParams, AWSAccount) {
  $scope.environments = [{name: 'production'}, {name: 'sandbox'}];
  $scope.aws_account = AWSAccount.get($stateParams, function() {
    if ($scope.aws_account.id && $scope.aws_account.id != 'new') {
      $scope.environments.forEach(function(environment) {
        $xml({
          method: 'POST',
          url: '/api/mturk',
          params: {
            aws_account_id: $scope.aws_account.id,
            environment: environment.name,
          },
          data: {
            Operation: 'GetAccountBalance',
          }
        }).then(function(res) {
          // res.data is a Document instance
          environment.account_balance = res.data.querySelector('FormattedPrice').textContent;
        });
      });
    }
  });

  $scope.sync = function() {
    var promise = $scope.aws_account.$save().then(function() {
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.$on('save', $scope.sync);
});
