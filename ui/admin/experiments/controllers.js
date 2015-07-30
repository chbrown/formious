/*jslint browser: true, esnext: true */
import {app} from '../app';
import {Url} from 'urlobject';
import {NotifyUI} from 'notify-ui';

app
.controller('admin.experiments.table', function($scope, $state, $location, Experiment, Administrator) {
  $scope.experiments = Experiment.query();
  $scope.administrators = Administrator.query();

  $scope.delete = function(experiment) {
    var promise = experiment.$delete().then(function() {
      $scope.experiments.splice($scope.experiments.indexOf(experiment), 1);
      return 'Deleted';
    });
    NotifyUI.addPromise(promise);
  };
})
.controller('admin.experiments.edit', function($scope, $state, $localStorage,
    Experiment, Template, Administrator) {
  $scope.$storage = $localStorage.$default({expand_experiment_html: false});

  var experiment = $scope.experiment = Experiment.get({id: $state.params.experiment_id});
  // $scope.aws_accounts = AWSAccount.query();
  $scope.administrators = Administrator.query();
  $scope.templates = Template.query();

  $scope.syncExperiment = function() {
    var promise = experiment.$save(function() {
      $state.go('.', {experiment_id: experiment.id}, {notify: false});
    }).then(function() {
      return 'Saved experiment';
    });
    NotifyUI.addPromise(promise);
  };

  // the 'save' event is broadcast on rootScope when command+S is pressed
  $scope.$on('save', $scope.syncExperiment);

  // generate link to hit creation page
  $scope.site_url = Url.parse(window.location).merge({path: '/'}).toString();
});
