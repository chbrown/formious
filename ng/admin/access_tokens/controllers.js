/*jslint browser: true, devel: true */ /*globals _, angular, app, Url, p, summarizeResponse */

app.controller('admin.access_tokens.table', function($scope, $flash, AccessToken) {
  $scope.access_tokens = AccessToken.query();

  $scope.delete = function(index) {
    var promise = $scope.access_tokens[index].$delete().then(function() {
      $scope.access_tokens.splice(index, 1);
      return 'Deleted';
    }, summarizeResponse);
    $flash(promise);
  };
});
