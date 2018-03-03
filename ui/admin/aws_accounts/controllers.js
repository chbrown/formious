import {app} from '../app'
import {NotifyUI} from 'notify-ui'

app
.controller('admin.aws_accounts.table', function($scope, AWSAccount) {
  $scope.aws_accounts = AWSAccount.query()
  $scope.delete = function(aws_account) {
    aws_account.$delete(function() {
      $scope.aws_accounts = AWSAccount.query()
    })
  }
})
.controller('admin.aws_accounts.edit', function($scope, $http, $turk, $stateParams, AWSAccount) {
  $scope.aws_account = AWSAccount.get($stateParams)

  $scope.sync = function() {
    var promise = $scope.aws_account.$save().then(function() {
      return 'Saved'
    })
    NotifyUI.addPromise(promise)
  }

  $scope.$on('save', $scope.sync)
})
