/*jslint browser: true */ /*globals _, app, Url, summarizeResponse */

app.controller('admin.experiments.table', function($scope, $flash, $state, $location, Experiment, Administrator) {
  $scope.experiments = Experiment.query();
  $scope.administrators = Administrator.query();

  $scope.delete = function(experiment) {
    var promise = experiment.$delete().then(function() {
      $scope.experiments.splice($scope.experiments.indexOf(experiment), 1);
      return 'Deleted';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.responses = function(experiment, ev) {
    ev.preventDefault();
    var promise = experiment.generateAccessToken().$promise.then(function(access_token) {
      var url = ['', access_token.relation, access_token.foreign_id, 'responses'].join('/') + '?token=' + access_token.token;
      // leave the realm of ui-router:
      window.location = url;
      return 'Generated';
    }, summarizeResponse);
    $flash(promise);
  };
});

app.controller('admin.experiments.edit', function($scope, $flash, $state, $localStorage,
    Experiment, Template, Administrator) {
  $scope.$storage = $localStorage.$default({expand_experiment_html: false});

  $scope.experiment = Experiment.get({id: $state.params.experiment_id});
  // $scope.aws_accounts = AWSAccount.query();
  $scope.administrators = Administrator.query();
  $scope.templates = Template.query();

  $scope.syncExperiment = function() {
    var promise = $scope.experiment.$save(function() {
      $state.go('.', {id: $scope.experiment.id}, {notify: false});
    }).then(function() {
      return 'Saved experiment';
    }, summarizeResponse);
    $flash(promise);
  };

  // the 'save' event is broadcast on rootScope when command+S is pressed
  $scope.$on('save', $scope.syncExperiment);

  $scope.responses = function(ev) {
    ev.preventDefault();
    var promise = $scope.experiment.generateAccessToken().$promise.then(function(access_token) {
      var url = ['', access_token.relation, access_token.foreign_id, 'responses'].join('/') + '?token=' + access_token.token;
      // leave the realm of ui-router:
      window.location = url;
      return 'Generated';
    }, summarizeResponse);
    $flash(promise);
  };

  // generate link to hit creation page
  $scope.site_url = Url.parse(window.location).merge({path: '/'}).toString();
});
