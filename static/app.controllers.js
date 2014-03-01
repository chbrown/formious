/*jslint browser: true, devel: true */ /*globals _, angular, app, Url, p, fileinputText, afterPromise */

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

  $scope.sync = function(ev) {
    p('sync', $scope.experiment);
    var opts = sync_options($scope.experiment);
    var ajax_promise = $http(opts).then(function(res) {
      _.extend($scope.experiment, res.data);
      return 'Saved';
    }, function(res) {
      return summarizeResponse(res);
    });
    afterPromise(ev.target, ajax_promise);
  };

  $scope.syncStim = function(stim, ev) {
    p('syncStim', stim);

    var opts = sync_options(stim);
    if (stim.id) {
      opts.url = window.location + '/stims/' + stim.id;
    }
    else {
      opts.url = window.location + '/stims';
    }

    var ajax_promise = $http(opts).then(function(res) {
      _.extend($scope.experiment, res.data);
      return 'Saved';
    }, function(res) {
      return summarizeResponse(res);
    });
    afterPromise(ev.target, ajax_promise);
  };

  $scope.previewStim = function(stim) {
    p('previewStim', stim);
    $scope.show_preview = true;

    // the stim template html will expect window.context
    var iframe = document.querySelector('iframe');
    // var iframe_window = iframe.contentWindow;
    // var iframe_document = iframe_window.document;
    p('iframe', iframe, iframe.contentWindow);

    // iframe.contentWindow.document.addEventListener('load', function(ev) {
    //   console.log('iframe.contentWindow', 'load', ev);
    // });

    iframe.src = '/admin/experiments/' + $scope.experiment.id + '/stims/' + stim.id + '/render';
    // console.log(iframe.contentWindow.testfn());
    // iframe.contentWindow.init(stim.context);
    // $http({method: 'GET', url: '/admin/templates/' + stim.template_id + '.json'}).then(function(res) {
    //   iframe_document.body.innerHTML = res.data.template.html;
    // }, p);
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

app.controller('adminAWSAccountEditor', function($scope, $http, $localStorage) {
  $scope.aws_account = window.aws_account;

  $scope.aws_account.hosts = [{name: 'deploy'}, {name: 'sandbox'}];

  $scope.aws_account.hosts.forEach(function(host) {
    var url = '/admin/aws/' + $scope.aws_account.id + '/hosts/' + host.name + '/GetAccountBalance';
    $http({method: 'POST', url: url}).then(function(res) {
      var price = res.data.GetAccountBalanceResult.AvailableBalance.FormattedPrice;
      host.account_balance = price;
    });
  });
});

var summarizeResponse = function(res) {
  var parts = [];
  if (res.status != 200) {
    parts.push('Error ');
  }
  parts.push(res.status);
  if (res.data) {
    parts.push(': ' + res.data.toString());
  }
  return parts.join('');
};

app.controller('adminTemplateEditor', function($scope, $http, $timeout) {
  $scope.template = window.template;
  $scope.keydown = function(ev) {
    if (ev.which == 83 && ev.metaKey) {
      // command+S
      ev.preventDefault();
      ev.target = document.getElementById('save_button');
      $scope.sync(ev);
    }
  };

  $scope.sync = function(ev) {
    var opts = sync_options($scope.template);
    var ajax_promise = $http(opts).then(function(res) {
      return 'Saved';
    }, function(res) {
      return summarizeResponse(res);
    });
    afterPromise(ev.target, ajax_promise);
  };
});
