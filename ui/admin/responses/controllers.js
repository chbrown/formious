import _ from 'lodash';
import {app} from '../app';

app
.controller('admin.responses.table', ($scope, $timeout, $localStorage, Response, Template, Experiment) => {
  $scope.$storage = $localStorage.$default({
    responses_query: {
      order_column: 'created',
      order_direction: 'DESC',
      limit: 250,
    },
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
      .pluck('context')
      .map(_.keys)
      .flatten()
      .uniq()
      .without('$$hashKey')
      .value();

      $scope.value_keys = _.chain($scope.responses)
      .pluck('value')
      .map(_.keys)
      .flatten()
      .uniq()
      .without('$$hashKey')
      .value();
    });
  };
  $scope.$watch('$storage.responses_query', _.debounce($scope.refresh, 500), true);
});
