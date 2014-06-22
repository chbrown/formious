/*jslint browser: true, devel: true */ /*globals _, angular, app, p, Url, summarizeResponse */

app.controller('adminAWSAccountsCtrl', function($scope, AWSAccount) {
  $scope.aws_accounts = AWSAccount.query();
  $scope.delete = function(aws_account) {
    aws_account.$delete(function() {
      $scope.aws_accounts = AWSAccount.query();
    });
  };
});

app.controller('adminAWSAccountCtrl', function($scope, $http, $flash, $stateParams, AWSAccount) {
  $scope.hosts = [{name: 'deploy'}, {name: 'sandbox'}];
  $scope.aws_account = AWSAccount.get($stateParams, function() {
    if ($scope.aws_account.id && $scope.aws_account.id != 'new') {
      $scope.hosts.forEach(function(host) {
        $http({
          method: 'POST',
          url: '/api/mturk/GetAccountBalance',
          params: {
            aws_account_id: $scope.aws_account.id,
            host: host.name,
          }
        }).then(function(res) {
          var price = res.data.GetAccountBalanceResult.AvailableBalance.FormattedPrice;
          host.account_balance = price;
        });
      });
    }
  });

  $scope.sync = function(ev) {
    var promise = $scope.aws_account.$save().then(function(res) {
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };
});
