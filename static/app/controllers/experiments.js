/*jslint browser: true, devel: true */ /*globals _, angular, app, p, Url, summarizeResponse */

app.controller('adminExperimentsCtrl', function($scope, $flash, $state, $location, Experiment, Administrator) {
  $scope.experiments = Experiment.query();
  $scope.administrators = Administrator.query();

  $scope.delete = function(experiment) {
    var promise = experiment.$delete().then(function() {
      $scope.experiments.splice($scope.experiments.indexOf(experiment), 1);
      return 'Deleted';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };

  $scope.responses = function(experiment, ev) {
    ev.preventDefault();
    var promise = experiment.generateAccessToken().$promise.then(function(access_token) {
      var url = ['', access_token.relation, access_token.foreign_id, 'responses'].join('/') + '?token=' + access_token.token;
      // leave the realm of ui-router:
      window.location = url;
      return 'Generated';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };
});

app.controller('adminExperimentCtrl', function($scope, $http, $state, $localStorage, $flash, $q,
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
    $flash.addPromise(promise);
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
    $flash.addPromise(promise);
  };

  // generate link to hit creation page
  $scope.site_url = Url.parse(window.location).merge({path: '/'}).toString();

  var addStimData = function(data) {
    // data is an object with columns: [String] and rows: [Object]

    // update the parameters first
    var new_parameters = _.difference(data.columns, $scope.experiment.parameters, 'template');
    $scope.experiment.parameters = $scope.experiment.parameters.concat(new_parameters);

    var max_view_order = Math.max.apply(Math, _.pluck($scope.stims, 'view_order'));
    var view_order = Math.max(max_view_order, 0) + 1;

    // and then add the stims to the table
    var stims = data.rows.map(function(row) {
      // stim has properties like: context, template_id, view_order
      var stim = {
        experiment_id: $scope.experiment.id,
        context: _.omit(row, 'template'),
        view_order: view_order++,
      };
      if (row.template) {
        var template = _.findWhere($scope.templates, {name: row.template});
        if (template) {
          stim.template_id = template.id;
        }
        // TODO: handle templates that cannot be found
      }
      return stim;
    });

    var promises = stims.map(function(stim) {
      return new Stim(stim).$save();
    });

    $q.all(promises).then(function() {
      $scope.stims = Stim.query({experiment_id: $scope.experiment.id});
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

    var reader = new FileReader();
    reader.onerror = function(err) {
      p('File reader error', err);
    };
    reader.onload = function(ev) {
      p('File reader loaded', ev, reader.result);
      var file_name = file.name;
      var file_size = file.size;
      // data is an arraybufferview as basic bytes / chars
      var data = new Uint8Array(reader.result);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/table');
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('X-Filename', file.name);
      xhr.onload = function(ev) {
        $scope.$apply(function() {
          addStimData(JSON.parse(xhr.responseText));
        });
      };
      xhr.send(data);
    };
    reader.readAsArrayBuffer(file);
  });
});
