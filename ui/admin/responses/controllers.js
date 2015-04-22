/*jslint browser: true */ /*globals _, app */

app.controller('admin.responses.table', function($scope, Response) {
  $scope.value_keys = [];
  $scope.responses = Response.query({}, function() {
    $scope.context_keys = _.chain($scope.responses).pluck('context').map(_.keys).flatten().uniq().without('$$hashKey').value();
    $scope.value_keys = _.chain($scope.responses).pluck('value').map(_.keys).flatten().uniq().without('$$hashKey').value();
  });
});
