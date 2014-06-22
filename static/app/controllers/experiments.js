/*jslint browser: true, devel: true */ /*globals _, angular, app, p, Url, summarizeResponse */

app.controller('adminExperimentsCtrl', function($scope, $flash, $state, $location, Experiment, Administrator) {
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

app.controller('adminExperimentCtrl', function($scope, $flash, $http, $state, $localStorage, $q,
    Experiment, Template, Administrator, AWSAccount, Stim) {
  $scope.$storage = $localStorage.$default({expand_experiment_html: false});

  $scope.experiment = Experiment.get($state.params);
  $scope.aws_accounts = AWSAccount.query();
  $scope.administrators = Administrator.query();
  $scope.templates = Template.query();
  $scope.stims = Stim.query({experiment_id: $state.params.id});

  $scope.keydown = function(ev) {
    if (ev.which == 83 && ev.metaKey) {
      // command+S
      ev.preventDefault();
      $scope.sync(ev);
    }
  };

  $scope.sync = function() {
    var promise = $scope.experiment.$save(function() {
      $state.go('.', {id: $scope.experiment.id}, {notify: false});
    }).then(function() {
      return 'Saved';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.deleteStim = function(stim) {
    stim.$delete(function() {
      // Stim.query({experiment_id: $scope.experiment.id});
      $scope.stims.splice($scope.stims.indexOf(stim), 1);
    });
  };

  $scope.deleteSelectedStims = function() {
    var promises = $scope.stims.filter(function(stim) {
      return stim.selected;
    }).map(function(stim) {
      return stim.$delete();
    });
    $q.all(promises).then(function() {
      $scope.stims = Stim.query({experiment_id: $scope.experiment.id});
    });
  };

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

  // p('Template--', Template.findOrCreate);
  // window.Template = Template;

  var addStimData = function(columns, rows) {
    /**
      columns: Array[String]
      rows: Array[Object]
    */
    // update the parameters first
    var parameters = _.difference(columns, 'template');
    $scope.experiment.parameters = _.union($scope.experiment.parameters, parameters);

    var max_view_order = Math.max.apply(Math, _.pluck($scope.stims, 'view_order'));
    var view_order = Math.max(max_view_order, 0) + 1;

    // and then add the stims to the table
    var stim_promises = rows.map(function(row, i) {
      // stim has properties like: context, template_id, view_order
      // handle templates that cannot be found simply by creating new ones
      // compute this outside because the promises are not guaranteed to execute in order
      return Template.findOrCreate(row.template).then(function(template) {
        return new Stim({
          experiment_id: $scope.experiment.id,
          context: row,
          view_order: view_order + i,
          template_id: template.id,
        }).$save();
      });
    });

    $q.all(stim_promises).then(function(stims) {
      // = Stim.query({experiment_id: $scope.experiment.id});
      $scope.stims = $scope.stims.concat(stims);
    });
  };

  // hack: wish angular.js would just wrap onchange events without the model requirement
  var upload_el = document.querySelector('#upload');
  angular.element(upload_el).on('change', function(ev) {
    var input = ev.target;

    var file = input.files[0];
    p('parseUpload:', file);
    // sample file = {
    //   lastModifiedDate: Tue Mar 04 2014 15:57:25 GMT-0600 (CST)
    //   name: "asch-stims.xlsx"
    //   size: 34307
    //   type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    //   webkitRelativePath: ""
    // }

    // readTabularFile is defined in local.js
    readTabularFile(file, function(err, data) {
      if (err) {
        $flash(file.name);
        // $rootScope.$emit('flash', 'Error uploading file: ' + file.name);
        // return $flash.add();
      }

      $scope.$apply(function() {
        addStimData(data.columns, data.rows);
      });
    });

  });
});

