/*jslint browser: true, devel: true */ /*globals _, angular, app, Url, p, summarizeResponse */

app.controller('adminResponsesCtrl', function($scope) {
  $scope.responses = window.responses;

  var contexts = {};
  var values = {};
  $scope.responses.forEach(function(response) {
    _.extend(contexts, response.context);
    _.extend(values, response.value);
  });
  $scope.context_keys = Object.keys(contexts);
  $scope.value_keys = Object.keys(values);
});

// app.controller('adminStimsCtrl', function($scope, $q, Stim) {
//   p('adminStimsCtrl', $scope);
//   // $scope.syncStim = function(stim, ev) {
//   //   var ajax_promise = $http(opts).then(function(res) {
//   //     return 'Saved';
//   //   }, summarizeResponse);
//   //   $flash(ajax_promise);
//   // };
// });
