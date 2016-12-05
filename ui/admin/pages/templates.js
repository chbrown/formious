import React from 'react';

export class TemplatesLayout extends React.Component {
  render() {
    return (
      <div>
        <nav fixedflow className="sub">
          <a ui-sref="admin.templates.table" ui-sref-active="current" className="tab">List templates</a>
          <a ui-sref="admin.templates.edit({id: 'new'})" ui-sref-active="current" className="tab">New template</a>
        </nav>
        {children}
      </div>
    );
  }
}

export class TemplatesTable extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>Templates</h3>
        </section>

        <section className="box">
          <table className="striped lined padded fill">
            <thead>
              <tr>
                <th>Name</th>
                <th>HTML</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="template in templates">
                <td title="{template.id}">
                  <a ui-sref="admin.templates.edit({id: template.id})">{template.name}</a>
                </td>
                <td><code>{template.html.slice(0, 100)}</code></td>
                <td><time>{template.created | date:"yyyy-MM-dd"}</time></td>
                <td>
                  <button ng-click="delete(template)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    );
  }
}

export class TemplatesEdit extends React.Component {
  render() {
    return (
      <div>
        {/*<section style="float: right" className="hpad">
          <button ng-click="clone()">Clone</button>
        </section>*/}

        <form ng-submit="sync($event)" className="hpad">
          <label className="block">
            <div><b>Name</b></div>
            <input type="text" ng-model="template.name" style="width: 100%;" />
          </label>

          <label className="block">
            <div><b>Created</b></div>
            <time>{template.created | date:"yyyy-MM-dd"}</time>
          </label>

          <label className="block">
            <div><b>HTML</b></div>
            <textarea enhance ng-model="template.html" className="code"
              placeholder="HTML / Handlebars content" style="width: 100%; min-height: 200px;"></textarea>
          </label>

          <div className="block">
            <button>Save</button>
          </div>
        </form>
      </div>
    );
  }
}

app
.controller('admin.templates.table', function($scope, Template) {
  $scope.templates = Template.query();
  $scope.delete = function(template) {
    // is this really the best way?
    var promise = template.$delete().then(function() {
      $scope.templates.splice($scope.templates.indexOf(template), 1);
      return 'Deleted';
    });
    NotifyUI.addPromise(promise);
  };
})
.controller('admin.templates.edit', function($scope, $http, $stateParams, $state, $location, Template) {
  $scope.template = Template.get($stateParams);

  $scope.sync = function() {
    var promise = $scope.template.$save().then(function() {
      $state.go('.', {id: $scope.template.id}, {notify: false});
      return 'Saved template';
    });
    NotifyUI.addPromise(promise);
  };

  // the 'save' event is broadcast on rootScope when command+S is pressed
  $scope.$on('save', $scope.sync);

  $scope.clone = function() {
    $state.go('.', {id: 'new'}, {notify: false});
    $scope.template = new Template({
      name: $scope.template.name + ' copy',
      html: $scope.template.html,
    });
  };
});
