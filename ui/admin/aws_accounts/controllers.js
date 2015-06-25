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
.controller('admin.aws_accounts.edit', function($scope, $http, $xml, $flash, $stateParams, AWSAccount) {
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
          /** res.data is a Document instance; a successful response looks like this:

              <?xml version="1.0"?>
              <GetAccountBalanceResponse>
                <OperationRequest>
                  <RequestId>2d3fc952-8df3-b65b-6cc4-68ac6892b71a</RequestId>
                </OperationRequest>
                <GetAccountBalanceResult>
                  <Request><IsValid>True</IsValid></Request>
                  <AvailableBalance>
                    <Amount>239.410</Amount>
                    <CurrencyCode>USD</CurrencyCode>
                    <FormattedPrice>$239.41</FormattedPrice>
                  </AvailableBalance>
                </GetAccountBalanceResult>
              </GetAccountBalanceResponse>
          */
          environment.account_balance = res.data.querySelector('FormattedPrice').textContent;
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
