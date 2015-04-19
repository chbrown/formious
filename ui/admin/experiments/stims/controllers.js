/*jslint browser: true, devel: true */ /*globals app, summarizeResponse */

app.controller('stimEditCtrl', function($scope, $flash, $http, $state, $localStorage, $q,
    Experiment, Template, Administrator, AWSAccount, Stim) {
  $scope.$storage = $localStorage.$default({expand_experiment_html: false});

  $scope.stim = Stim.get($state.params);
  $scope.experiments = Experiment.query();
  $scope.templates = Template.query();

// the 'save' event is broadcast on rootScope when command+S is pressed
  $scope.$on('save', $scope.sync);

  $scope.sync = function() {
    var promise = $scope.stim.$save(function() {
      $state.go('.', {id: $scope.stim.id}, {notify: false});
    }).then(function() {
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };
});
