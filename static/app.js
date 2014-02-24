/*jslint browser: true, devel: true */ /*globals _, angular, Url, p, fileinputText */

var app = angular.module('app', ['ngStorage']);

app.controller('adminTableCtrl', function($scope) {
  $scope.table = window.table;
});

app.controller('adminExperimentEditor', function($scope, $http, $localStorage) {
  $scope.experiment = window.experiment;

  $http({method: 'GET', url: '/admin/administrators.json'}).then(function(res) {
    $scope.administrators = res.data.administrators;
  }, p);

  $http({method: 'GET', url: '/admin/templates.json'}).then(function(res) {
    $scope.templates = res.data.templates;
  }, p);

  // so if we
  var stims_url = Url.parse(window.location);
  stims_url.path += '/stims.json';
  $http({method: 'GET', url: stims_url.toString()}).then(function(res) {
    $scope.experiment.stims = res.data.stims;
  }, p);


  // var workerId = this.model.get('WorkerId');
  // var worker = new MTWorker({id: workerId});
  // worker.fetch({
  //   success: function(model, user, options) {
  //     // infer required columns from list of responses
  //     var keys = {};
  //     user.responses.slice(0, 50).forEach(function(response) {
  //       _.extend(keys, response);
  //     });
  //     // create table and simply put where the button was
  //     var cols = _.keys(keys).sort();
  //     var table_html = tabulate(user.responses, cols);
  //     $(ev.target).replaceWith(table_html);
  //   }
  // });

  var sync_options = function(record) {
    if (record.id) {
      // update
      return {
        method: 'PATCH',
        url: window.location,
        data: record,
      };
    }
    else {
      // create
      return {
        method: 'POST',
        url: '.',
        data: record,
      };
    }
  };

  $scope.syncExperiment = function(experiment) {
    p('syncExperiment', experiment);
    var opts = sync_options(experiment);
    $http(opts).then(function(res) {
      // var message = jqXHR.getResponseHeader('x-message') || 'Success!';
      // if (redirect) {
      //   // pushState/replaceState arguments: (state_object, dummy, url)
      //   // history.pushState(form_obj, '', redirect);
      //   window.location = redirect;
      // }
      p('sync response', res, res.data);
    }, function(res) {
      // $button.flag({text: jqXHR.responseText, fade: 3000});
      p('sync error', res);
    });
  };

  $scope.syncStim = function(stim) {
    p('syncStim', stim);
    var opts = sync_options(stim);
    if (stim.id) {
      opts.url = window.location + '/stims/' + stim.id;
    }
    else {
      opts.url = window.location + '/stims';
    }

    $http(opts).then(function(res) {
      p('sync response', res, res.data);
    }, p);
  };

  // hack: wish angular.js would just wrap onchange events without the model requirement
  var upload_el = document.querySelector('#upload');
  angular.element(upload_el).on('change', function(ev) {
    p('parseUpload: ', ev);

    fileinputText(ev.target, function(err, file_contents, file_name, file_size) {

      // var message = 'Uploading ' + file_name + ' (' + file_size + ' bytes)';
      $http({method: 'POST', url: '/api/sv', data: file_contents}).then(function(res) {
        // xxx: should merge parameters, not overwrite
        $scope.experiment.parameters = res.data.columns;
        pushAll($scope.experiment.stims, res.data.rows);
      }, p);

      // infer things about the stimlist from what they just uploaded
      // var segmented = _.contains(data.columns, 'segment');
      // self.set('segmented', segmented);
      // if (segmented) {
      //   var segments = _.pluck(data.rows, 'segment');
      //   self.set('segments', _.uniq(segments));
      // }

      // var message = 'Processed upload into ' + self.model.get('states').length + ' rows.';
    });
  });
});

app.directive('help', function() {
  return {
    restrict: 'C',
    template: '<div class="summary" ng-bind="summary"></div>' +
      '<div class="content" ng-transclude></div>',
    transclude: true,
    link: function(scope, el, attrs) {
      scope.summary = el.text().slice(0, 50) + '...'; // &hellip;
      el.on('click', function() {
        el.toggleClass('expanded');
      });
    }
  };
});

app.directive('anchorform', function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<form style="display: inline">' +
      '<button ng-transclude></button></form>',
    transclude: true
  };
});
