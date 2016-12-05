import React from 'react';
import _ from 'lodash';

export class ResponsesTable extends React.Component {
  render() {
    return (
      <div>
        <section className="hpad">
          <h3>Responses</h3>
        </section>

        <section className="box hpad">
          <form ng-submit="refresh()">
            <div className="controls">
              <label className="control">
                <div><b>Template</b></div>
                <select ng-model="$storage.responses_query.template_id"
                  ng-options="template.id as template.name for template in templates">
                  <option value>-- all --</option>
                </select>
              </label>
              <label className="control">
                <div><b>Experiment</b></div>
                <select ng-model="$storage.responses_query.experiment_id"
                  ng-options="experiment.id as experiment.name for experiment in experiments">
                  <option value>-- all --</option>
                </select>
              </label>
              <div className="control">
                <div><b>Order</b></div>
                <select ng-model="$storage.responses_query.order_column">
                  <option value="experiment_id">experiment_id</option>
                  <option value="template_id">template_id</option>
                  <option value="view_order">view_order</option>
                  <option value="created">created</option>
                </select>
                <select ng-model="$storage.responses_query.order_direction">
                  <option value="ASC" title="smallest first">ASC</option>
                  <option value="DESC" title="largest first">DESC</option>
                </select>
              </div>
              <div className="control">
                <div><b>Limit</b></div>
                <input ng-model="$storage.responses_query.limit" type="number" />
              </div>
            </div>
          </form>
        </section>

        <section className="hpad">
          <p>Showing {responses.length} out of {responses.length === 0 ? 0 : (responses[0].count ? responses[0].count : 'N/A')} responses</p>
        </section>

        <section className="box">
          <table className="striped grid padded fill">
            <thead>
              <tr>
                <th>Response ID</th>
                <th>Block ID</th>
                <th>Experiment ID</th>
                <th>Participant ID</th>
                <th>AWS Worker ID</th>
                <th ng-repeat="key in context_keys" className="context">
                  context.{key}
                </th>
                <th ng-repeat="key in value_keys" className="value">
                  value.{key}
                </th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="response in responses">
                <td>{response.id}</td>
                <td>{response.block_id}</td>
                <td>{response.experiment_id}</td>
                <td>{response.participant_id}</td>
                <td>{response.aws_worker_id}</td>
                <td ng-repeat="key in context_keys" className="context">
                  {response.context[key]}
                </td>
                <td ng-repeat="key in value_keys" className="value">
                  {response.value[key]}
                </td>
                <td><time>{response.created | date:"yyyy-MM-dd"}</time></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    );
  }
}

app
.controller('admin.responses.table', ($scope, $timeout, $localStorage, Response, Template, Experiment) => {
  $scope.$storage = $localStorage.$default({
    responses_query: {
      order_column: 'created',
      order_direction: 'DESC',
      limit: 250,
    }
  });
  $scope.templates = Template.query();
  $scope.experiments = Experiment.query();
  $scope.value_keys = [];

  $scope.refresh = () => {
    var params = {
      experiment_id: $scope.$storage.responses_query.experiment_id,
      template_id: $scope.$storage.responses_query.template_id,
      order_column: $scope.$storage.responses_query.order_column,
      order_direction: $scope.$storage.responses_query.order_direction,
      limit: $scope.$storage.responses_query.limit,
    };
    $scope.responses = Response.query(params, function() {
      $scope.context_keys = _.chain($scope.responses)
        .pluck('context').map(_.keys).flatten().uniq().without('$$hashKey').value();
      $scope.value_keys = _.chain($scope.responses)
        .pluck('value').map(_.keys).flatten().uniq().without('$$hashKey').value();
    });
  };
  $scope.$watch('$storage.responses_query', _.debounce($scope.refresh, 500), true);
});
