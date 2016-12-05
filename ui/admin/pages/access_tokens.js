import React from 'react';

export class AccessTokensTable extends React.Component {
  componentWillMount() {
    $scope.access_tokens = AccessToken.query();

    $scope.delete = function(index) {
      var promise = $scope.access_tokens[index].$delete().then(function() {
        $scope.access_tokens.splice(index, 1);
        return 'Deleted';
      });
      NotifyUI.addPromise(promise);
    };
  }
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>Access Tokens</h3>
        </section>

        <section className="box">
          <table className="striped lined padded fill">
            <thead>
              <tr>
                <th>ID</th>
                <th>Token</th>
                <th>Relation / Foreign ID</th>
                <th>Expires</th>
                <th>Redacted</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="access_token in access_tokens">
                <td title={access_token.id}>
                  <a ui-sref="admin.access_tokens.edit({access_token_id: access_token.id})">{access_token.id}</a>
                </td>
                <td>{access_token.token}</td>
                <td>
                  <a href={`/admin/${access_token.relation}/${access_token.foreign_id}`}>{access_token.relation}/{access_token.foreign_id}</a>
                </td>
                <td><time>{access_token.expires | date:"yyyy-MM-dd"}</time></td>
                <td><time>{access_token.redacted | date:"yyyy-MM-dd"}</time></td>
                <td><time>{access_token.created | date:"yyyy-MM-dd"}</time></td>
                <td>
                  <button ng-click="delete($index)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    );
  }
}

export class AccessTokensLayout extends React.Component {
  render() {
    return (
      <div>
        <nav fixedflow className="sub">
          <a ui-sref="admin.access_tokens.table" ui-sref-active="current" className="tab">List access tokens</a>
          <a ui-sref="admin.access_tokens.edit({access_token_id: 'new'})" ui-sref-active="current" className="tab">New access token</a>
        </nav>
        {children}
      </div>
    );
  }
}

export class AccessTokensEdit extends React.Component {
  componentWillMount() {
    $scope.access_token = AccessToken.get({id: $state.params.access_token_id});
  }
  render() {
    return (
      <form ng-submit="sync($event)" className="hpad">
        <label className="block">
          <div><b>Token</b></div>
          <input type="text" ng-model="access_token.token" style="width: 100%;" />
        </label>

        <label className="block">
          <div><b>Relation</b></div>
          <input type="text" ng-model="access_token.relation" style="width: 100%;" />
        </label>

        <label className="block">
          <div><b>Foreign ID</b></div>
          <input type="text" ng-model="access_token.foreign_id" style="width: 100%;" />
        </label>

        <label className="block">
          <div><b>Expires</b></div>
          <time>{access_token.expires | date:"yyyy-MM-dd"}</time>
        </label>

        <label className="block">
          <div><b>Redacted</b></div>
          <time>{access_token.redacted | date:"yyyy-MM-dd"}</time>
        </label>

        <label className="block">
          <div><b>Created</b></div>
          <time>{access_token.created | date:"yyyy-MM-dd"}</time>
        </label>

        <div className="block">
          <button>Save</button>
        </div>
      </form>
    );
  }
}
