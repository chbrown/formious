import React from 'react';

export class AWSAccountsLayout extends React.Component {
  render() {
    return (
      <div>
        <nav fixedflow className="sub">
          <a ui-sref="admin.aws_accounts.table" ui-sref-active="current" className="tab">List AWS Accounts</a>
          <a ui-sref="admin.aws_accounts.edit({id: 'new'})" ui-sref-active="current" className="tab">New AWS Account</a>
        </nav>
        {children}
      </div>
    );
  }
}

export class AWSAccountsTable extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>AWS Accounts</h3>
        </section>

        <section className="box">
          <table className="striped lined padded fill">
            <thead>
              <tr>
                <th>Name</th>
                <th>Access Key ID</th>
                <th>Secret Access Key</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="aws_account in aws_accounts">
                <td><a ui-sref="admin.aws_accounts.edit({id: aws_account.id})">{aws_account.name}</a></td>
                <td>{aws_account.access_key_id}</td>
                <td>{aws_account.secret_access_key}</td>
                <td><time>{aws_account.created | date:"yyyy-MM-dd"}</time></td>
                <td>
                  <button ng-click="delete(aws_account)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    );
  }
}

export class AWSAccountsEdit extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>AWS Account: {aws_account.name}</h3>
        </section>

        <section className="box hpad">
          <form ng-submit="sync($event)">
            <label className="block">
              <div><b>Name</b></div>
              <input type="text" ng-model="aws_account.name" />
            </label>

            <label className="block">
              <div><b>Access Key ID</b></div>
              <input type="text" ng-model="aws_account.access_key_id" style="width: 400px" />
            </label>

            <label className="block">
              <div><b>Secret Access Key</b></div>
              <input type="text" ng-model="aws_account.secret_access_key" style="width: 400px" />
            </label>

            <label className="block">
              <div><b>Created</b></div>
              <time>{aws_account.created | date:"yyyy-MM-dd"}</time>
            </label>

            <div className="block">
              <button>Save</button>
            </div>
          </form>
        </section>
      </div>
    );
  }
}

import {NotifyUI} from 'notify-ui';

app
.controller('admin.aws_accounts.table', function($scope, AWSAccount) {
  $scope.aws_accounts = AWSAccount.query();
  $scope.delete = function(aws_account) {
    aws_account.$delete(function() {
      $scope.aws_accounts = AWSAccount.query();
    });
  };
})
.controller('admin.aws_accounts.edit', function($scope, $http, $turk, $stateParams, AWSAccount) {
  $scope.aws_account = AWSAccount.get($stateParams);

  $scope.sync = function() {
    var promise = $scope.aws_account.$save().then(function() {
      return 'Saved';
    });
    NotifyUI.addPromise(promise);
  };

  $scope.$on('save', $scope.sync);
});
