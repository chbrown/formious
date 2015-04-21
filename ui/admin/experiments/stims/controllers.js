/*jslint browser: true */ /*globals _, app, summarizeResponse */

app.controller('admin.experiments.edit.stims', function($scope, $localStorage, $state, $flash, $q, Template, Stim, parseTabularFile) {
  $scope.$storage = $localStorage;
  $scope.stims = Stim.query({experiment_id: $state.params.experiment_id});
  $scope.templates = Template.query();

  $scope.deleteStim = function(stim) {
    stim.$delete(function() {
      $scope.stims.splice($scope.stims.indexOf(stim), 1);
    });
  };

  $scope.deleteSelectedStims = function() {
    var promises = $scope.stims.filter(function(stim) {
      return stim.selected;
    }).map(function(stim) {
      return stim.$delete();
    });
    var promise = $q.all(promises).then(function() {
      $scope.stims = Stim.query({experiment_id: $scope.experiment.id});
      return 'Deleted ' + promises.length + ' stims';
    });
    $flash(promise);
  };

  $scope.updateSelectedStims = function(props) {
    var promises = $scope.stims.filter(function(stim) {
      return stim.selected;
    }).map(function(stim) {
      _.extend(stim, props);
      return stim.$save();
    });
    var promise = $q.all(promises).then(function() {
      return 'Updated ' + promises.length + ' stims';
    });
    $flash(promise);
  };

  /** addStimData(contexts: any[])
  */
  var addStimData = function(contexts) {
    var max_view_order = Math.max.apply(Math, _.pluck($scope.stims, 'view_order'));
    var view_order = Math.max(max_view_order, 0) + 1;

    var default_context = {template_id: $scope.selected_template_id};

    // and then add the stims to the table
    var stim_promises = contexts.map(function(context, i) {
      context = _.extend({}, default_context, context);
      // stim has properties like: context, template_id, view_order
      // handle templates that cannot be found simply by creating new ones
      // compute this outside because the promises are not guaranteed to execute in order
      return Template.findOrCreate(context.template).then(function(template) {
        return new Stim({
          experiment_id: $scope.experiment.id,
          context: context,
          view_order: view_order + i,
          template_id: template.id,
        }).$save();
      });
    });

    return $q.all(stim_promises).then(function(stims) {
      // = Stim.query({experiment_id: $scope.experiment.id});
      $scope.stims = $scope.stims.concat(stims);
      return 'Added ' + stim_promises.length + ' stims';
    });
  };

  $scope.$watchCollection('stims', function() {
    // whenever stims change, we may need to update the experiment parameters
    var parameters_object = {};
    $scope.stims.forEach(function(stim) {
      for (var key in stim.context) {
        parameters_object[key] = 1;
      }
    });
    delete parameters_object.template;
    var parameters = _.keys(parameters_object);
    $scope.experiment.parameters = _.union($scope.experiment.parameters, parameters);
  });

  /**
  Import stims from a file.

  Sample Excel (xlsx) spreadsheet:

      {
        lastModifiedDate: Tue Mar 04 2014 15:57:25 GMT-0600 (CST),
        name: "asch-stims.xlsx",
        size: 34307,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        webkitRelativePath: ""
      }

  Sample JSON:

      {
        lastModified: 1429379237000,
        lastModifiedDate: Sat Apr 18 2015 12:47:17 GMT-0500 (CDT),
        name: "questions-sample-100.json",
        size: 33125,
        type: "application/json",
        webkitRelativePath: ""
      }

  */
  $scope.importFile = function(file) {
    var promise = parseTabularFile(file).then(function(data) {
      return addStimData(data);
    }, function(err) {
      return 'Error uploading file "' + file.name + '": ' + err.toString();
    });
    $flash(promise);
  };
});

app.controller('admin.experiments.edit.stims.edit', function($scope, $localStorage, $state, $flash, Template, Stim) {
  $scope.$storage = $localStorage;
  $scope.stim = Stim.get({
    experiment_id: $state.params.experiment_id,
    id: $state.params.stim_id,
  }, function() {
    // set template_id to the default if it's not set
    _.defaults($scope.stim, {template_id: $localStorage.default_template_id});
  });
  $scope.templates = Template.query();

  // the 'save' event is broadcast on rootScope when command+S is pressed
  // not sure why it doesn't work here.
  $scope.$on('save', $scope.syncStim);

  $scope.syncStim = function() {
    var promise = $scope.stim.$save(function() {
      $state.go('^');
      // $state.go('.', {id: $scope.stim.id}, {notify: false});
    }).then(function() {
      return 'Saved stim';
    }, summarizeResponse);
    $flash(promise);
  };
});
