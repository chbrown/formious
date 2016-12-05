import React from 'react';
import {Link} from 'react-router';
import {NavLink} from '../components';

export class AdministratorsLayout extends React.Component {
  render() {
    return (
      <div>
        <nav fixedflow className="sub">
          <NavLink to="/administrators">List administrators</NavLink>
          <NavLink to="/administrators/new">New administrator</NavLink>
        </nav>
        {children}
      </div>
    );
  }
}

export class AdministratorsTable extends React.Component {
  componentDidMount() {
    fetch('/api/administrators/').then(administrators => {
      this.setState({administrators});
    });
  }
  delete(administrator) {
    var promise = administrator.$delete().then(function() {
      $scope.administrators.splice($scope.administrators.indexOf(administrator), 1);
      return 'Deleted';
    });
    NotifyUI.addPromise(promise);
  }
  render() {
    const {administrators} = this.props;
    return (
      <div>
        <section className="hpad">
          <h3>Administrators</h3>
        </section>
        <section className="box">
          <table className="striped lined padded">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {administrators.map(administrator =>
                <tr key={administrator.id}>
                  <td>{administrator.id}</td>
                  <td><Link href={`/admin/administrators/${administrator.id}`}>{administrator.email}</Link></td>
                  <td><time>{administrator.created | date:"yyyy-MM-dd"}</time></td>
                  <td>
                    <button ng-click="delete(administrator)">Delete</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  }
}


export class AdministratorsEdit extends React.Component {
  componentDidMount() {
    const {id} = this.props;
    fetch(`/api/administrator/${id}`).then(administrator => {
      this.setState({administrator});
    });

    var administrator_id = $stateParams.id;
    $scope.aws_accounts = AWSAccount.query();
    $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
  }

  // $scope.$on('save', $scope.sync);
  sync() {
    var promise = $scope.administrator.$save().then(function() {
      return 'Saved';
    });
    NotifyUI.addPromise(promise);
  }


  unlinkAWSAccount(account) {
    account.$delete(function() {
      $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
    });
  }

  linkAWSAccount(account) {
    var administrator_aws_account = new AWSAccountAdministrator(account);
    administrator_aws_account.administrator_id = $scope.administrator.id;

    var promise = administrator_aws_account.$save(function() {
      $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
    }).then(function() {
      return 'Saved';
    });
    NotifyUI.addPromise(promise);
  }

  render() {
    const {administrator} = this.state;
    return (
      <div>
        <section className="hpad">
          <h3>Administrator</h3>
        </section>

        <section className="box hpad">
          {/*method="PATCH" action="/admin/administrators/{administrator.id}"*/}
          <form ng-submit="sync($event)">
            <label className="block">
              <div><b>Email</b></div>
              <input type="text" ng-model="administrator.email" style="width: 200px" />
            </label>

            <label className="block">
              <div><b>Password</b> <span className="help">Leave blank to keep current password</span></b></div>
              <input type="password" ng-model="administrator.password" style="width: 200px" />
            </label>

            <label className="block">
              <div><b>Created</b></div>
              <time>{administrator.created | date:"medium"}</time>
            </label>

            <div className="block">
              <button>Save</button>
            </div>
          </form>
        </section>

        <section className="hpad">
          <h3>AWS Accounts</h3>
        </section>

        <section className="box hpad">
          <table className="lined">
            <thead>
              <tr>
                <th>Name</th>
                <th>Access Key ID</th>
                <th>Priority</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="aws_account in administrator_aws_accounts">
                <td><a ui-sref="admin.aws_accounts.edit({id: aws_account.id})">{aws_account.name}</a></td>
                <td>{aws_account.access_key_id}</td>
                <td>{aws_account.priority}</td>
                <td><time>{aws_account.created | date:"yyyy-MM-dd"}</time></td>
                <td>
                  <button ng-click="unlinkAWSAccount(aws_account)">Disown</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            <select ng-model="new_account.aws_account_id"
              ng-options="aws_account.id as aws_account.name for aws_account in aws_accounts"></select>
            <input ng-model="new_account.priority" type="number" placeholder="priority" />
            <button ng-click="linkAWSAccount(new_account)">Add account</button>
          </p>
        </section>
      </div>
    );
  }
}
