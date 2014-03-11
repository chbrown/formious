/*jslint browser: true, devel: true */ /*globals _, angular, app, Url, p, fileinputText, displayPromiseStatus */

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

app.controller('adminExperimentEditor', function($scope, $http, $localStorage) {
  $scope.$storage = $localStorage.$default({expand_experiment_html: false});

  var experiment_url = Url.parse(window.location);
  experiment_url.path += '.json';
  $http({method: 'GET', url: experiment_url}).then(function(res) {
    $scope.experiment = res.data.experiment;
  }, p);

  $http({method: 'GET', url: '/admin/administrators.json'}).then(function(res) {
    $scope.administrators = res.data.administrators;
  }, p);

  $http({method: 'GET', url: '/admin/aws.json'}).then(function(res) {
    $scope.hosts = [{name: 'deploy'}, {name: 'sandbox'}];
    $scope.aws_accounts = res.data.aws_accounts;
  }, p);

  $http({method: 'GET', url: '/admin/templates.json'}).then(function(res) {
    $scope.templates = res.data.templates;
    $scope.templates_lookup = toMap($scope.templates, 'id', 'name');
  }, p);

  var stims_url = Url.parse(window.location);
  stims_url.path += '/stims.json';
  $http({method: 'GET', url: stims_url.toString()}).then(function(res) {
    $scope.stims = res.data.stims;
  }, p);

  $scope.localizeUrl = function(url) {
    return Url.parse(url).toString();
  };

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
      if (res.status == 300) {
        window.location = res.headers().location;
      }
      // otherwise is error:
      return summarizeResponse(res);
    });
    displayPromiseStatus(ajax_promise, ev.target);
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
      _.extend(stim, res.data);
      return 'Saved';
    }, function(res) {
      return summarizeResponse(res);
    });

    if (ev) {
      displayPromiseStatus(ajax_promise, ev.target);
    }
  };

  // $scope.previewStim = function(stim) {
  //   // p('previewStim', stim);
  //   $scope.show_preview = true;

  //   // the stim template html will expect window.context
  //   var iframe = document.querySelector('iframe');
  //   // var iframe_window = iframe.contentWindow;
  //   // var iframe_document = iframe_window.document;
  //   p('iframe', iframe, iframe.contentWindow);

  //   // iframe.contentWindow.document.addEventListener('load', function(ev) {
  //   // });

  //   iframe.src = '/admin/experiments/' + $scope.experiment.id + '/stims/' + stim.id + '/render';
  //   // iframe.contentWindow.init(stim.context);
  //   // $http({method: 'GET', url: '/admin/templates/' + stim.template_id + '.json'}).then(function(res) {
  //   //   iframe_document.body.innerHTML = res.data.template.html;
  //   // }, p);
  // };

  $scope.next_view_order = function() {
    var max_view_order = Math.max.apply(Math, _.pluck($scope.stims, 'view_order'));
    return Math.max(max_view_order, 0) + 1;
  };

  $scope.addStim = function(stim) {
    // stim has properties like: context, template_id, view_order
    // cache view_order?
    if (stim.view_order === undefined) {
      stim.view_order = $scope.next_view_order();
    }

    $scope.syncStim(stim);
    $scope.stims.push(stim);
  };

  $scope.addStims = function(data) {
    // data is an object with columns: [String] and rows: [Object]

    // update the parameters first
    var new_parameters = _.difference(data.columns, $scope.experiment.parameters, 'template');
    $scope.experiment.parameters = $scope.experiment.parameters.concat(new_parameters);

    // and then add the stims to the table
    var view_order = $scope.next_view_order();
    data.rows.forEach(function(row) {
      var stim = {context: _.omit(row, 'template')};
      if (row.template) {
        var template = _.findWhere($scope.templates, {name: row.template});
        if (template) {
          stim.template_id = template.id;
        }
        // todo: handle templates that cannot be found
      }
      stim.view_order = view_order++;
      $scope.addStim(stim);
    });
  };

  $scope.deleteStim = function(stim) {
    var url = window.location + '/stims/' + stim.id;
    $http({method: 'DELETE', url: url}).then(function(res) {
      var index = $scope.stims.indexOf(stim);
      $scope.stims.splice(index, 1);
    }, p);
  };
  $scope.deleteSelectedStims = function(ev) {
    $scope.stims.filter(function(stim) {
      return stim.selected;
    }).forEach($scope.deleteStim);
  };


  // hack: wish angular.js would just wrap onchange events without the model requirement
  var upload_el = document.querySelector('#upload');
  angular.element(upload_el).on('change', function(ev) {
    var input = ev.target;

    var file = input.files[0];
    p('parseUpload: ', file);

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
          $scope.addStims(JSON.parse(xhr.responseText));
        });
      };
      xhr.send(data);
    };
    reader.readAsArrayBuffer(file);
  });
});

app.controller('adminAWSAccountEditor', function($scope, $http, $localStorage) {
  $scope.aws_account = window.aws_account;

  $scope.aws_account.hosts = [{name: 'deploy'}, {name: 'sandbox'}];

  if ($scope.aws_account.id) {
    $scope.aws_account.hosts.forEach(function(host) {
      var url = '/admin/aws/' + $scope.aws_account.id + '/hosts/' + host.name + '/GetAccountBalance';
      $http({method: 'POST', url: url}).then(function(res) {
        var price = res.data.GetAccountBalanceResult.AvailableBalance.FormattedPrice;
        host.account_balance = price;
      });
    });
  }

  $scope.sync = function(ev) {
    var form = angular.element(ev.target);
    var button = form.find('button');

    var opts = sync_options($scope.aws_account);
    var ajax_promise = $http(opts).then(function(res) {
      return 'Saved';
    }, function(res) {
      return summarizeResponse(res);
    });
    displayPromiseStatus(ajax_promise, button[0]);
  };
});

app.controller('adminHITEditor', function($scope, $http, $localStorage) {
  // defaults:
  $scope.$storage = $localStorage.$default({
    hit: {
      // Title: 'Exciting task!',
      // Description: 'Look at some cool pictures and answer a lot of really easy questions.',
      // Keywords: 'linguistic,verbal,words,meaning,research',
      MaxAssignments: '20',
      Reward: '0.05',
      Keywords: 'research,science',
      AssignmentDuration: '2h',
      Lifetime: '12h',
      AutoApprovalDelay: '24h',
      FrameHeight: '550',
    },
    preview_iframe: false,
  });

  _.extend($scope.$storage.hit, window.hit);

  $scope.sync = function(ev) {
    var ajax_promise = $http({
      method: 'POST',
      url: 'CreateHIT',
      data: $scope.$storage.hit,
    }).then(function(res) {
      return 'Created';
    }, function(res) {
      if (res.status == 300) {
        window.location = res.headers().location;
      }
      return summarizeResponse(res);
    });
    displayPromiseStatus(ajax_promise, ev.target);
  };

  // AWS adds four parameters: assignmentId, hitId, workerId, and turkSubmitTo (which is the host, not the full path)
  $scope.$watch('$storage.hit.ExternalURL', function(newVal, oldVal) {
    // p('$watch %s -> %s', oldVal, newVal, iframe);
    if (newVal && $scope.$storage.preview_iframe) {
      var iframe = document.querySelector('iframe');
      var url = Url.parse(newVal);
      _.extend(url.query, {
        // Once assigned, assignmentId is a 30-character alphadecimal mess
        // assignmentId: 'ASSIGNMENT_ID_NOT_AVAILABLE',
        assignmentId: '1234567890abcdef',
        hitId: '0PREVIEWPREVIEWPREVIEWPREVIEW9',
        workerId: 'A1234TESTING',
        // turkSubmitTo is normally https://workersandbox.mturk.com or https://www.mturk.com
        turkSubmitTo: ''
      });
      iframe.src = url.toString();
    }
  });

});

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
      if (res.status == 300) {
        window.location = res.headers().location;
      }
      return summarizeResponse(res);
    });
    displayPromiseStatus(ajax_promise, ev.target);
  };
});

app.controller('adminAdministratorEditor', function($scope, $http, $timeout) {
  $scope.administrator = window.administrator;
  $scope.sync = function(ev) {
    var opts = sync_options($scope.administrator);
    var ajax_promise = $http(opts).then(function(res) {
      return 'Saved';
    }, function(res) {
      return summarizeResponse(res);
    });
    displayPromiseStatus(ajax_promise, ev.target);
  };
});
