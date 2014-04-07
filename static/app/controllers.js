/*jslint browser: true, devel: true */ /*globals _, angular, app, Url, p */

var summarizeResponse = function(res) {
  // p('summarizeResponse', res);
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

// app.controller('adminStimsCtrl', function($scope, $q, Stim) {
//   p('adminStimsCtrl', $scope);
//   // $scope.syncStim = function(stim, ev) {
//   //   var ajax_promise = $http(opts).then(function(res) {
//   //     return 'Saved';
//   //   }, summarizeResponse);
//   //   $flash.addPromise(ajax_promise);
//   // };
// });

app.controller('adminExperimentsCtrl', function($scope, $flash, Experiment, Administrator) {
  $scope.experiments = Experiment.query();
  $scope.administrators = Administrator.query();
});

app.controller('adminExperimentCtrl', function($scope, $http, $localStorage, $flash, $q,
    Experiment, Template, Administrator, AWSAccount, Stim) {
  $scope.$storage = $localStorage.$default({expand_experiment_html: false});

  var current_url = Url.parse(window.location);
  var experiment_id = _.last(current_url.path.split('/'));

  $scope.experiment = Experiment.get({id: experiment_id});
  $scope.aws_accounts = AWSAccount.query();
  $scope.administrators = Administrator.query();
  $scope.templates = Template.query();
  $scope.stims = Stim.query({experiment_id: experiment_id});

  $scope.localizeUrl = function(url) {
    return Url.parse(url).toString();
  };

  $scope.keydown = function(ev) {
    if (ev.which == 83 && ev.metaKey) {
      // command+S
      ev.preventDefault();
      $scope.sync(ev);
    }
  };

  $scope.sync = function() {
    var promise = $scope.experiment.$save(function() {
      var experiment_url = '/admin/experiments/' + $scope.experiment.id;
      history.replaceState(null, '', experiment_url);
    }).then(function() {
      return 'Saved';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };

  $scope.deleteStim = function(stim) {
    stim.$delete(function() {
      // var index = $scope.stims.indexOf(stim);
      // $scope.stims.splice(index, 1);
      $scope.stims = Stim.query({experiment_id: experiment_id});
    });
  };

  $scope.deleteSelectedStims = function() {
    var promises = $scope.stims.filter(function(stim) {
      return stim.selected;
    }).map(function(stim) {
      return stim.$delete();
    });
    $q.all(promises).then(function() {
      $scope.stims = Stim.query({experiment_id: experiment_id});
    });
  };

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
      $scope.stims = Stim.query({experiment_id: experiment_id});
    });
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
          addStimData(JSON.parse(xhr.responseText));
        });
      };
      xhr.send(data);
    };
    reader.readAsArrayBuffer(file);
  });
});

app.controller('adminAWSAccountEditor', function($scope, $http, $localStorage, $flash) {
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
    var opts = sync_options($scope.aws_account);
    var promise = $http(opts).then(function(res) {
      return 'Saved';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };
});

app.controller('adminHITEditor', function($scope, $http, $localStorage, $flash) {
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
      var headers = res.headers();
      if (headers.location) window.location = headers.location;

      return summarizeResponse(res);
    });
    $flash.addPromise(ajax_promise);
  };

  // AWS adds four parameters: assignmentId, hitId, workerId, and turkSubmitTo
  //   turkSubmitTo is the host, not the full path
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

app.controller('adminHITReviewer', function($scope, $http, $localStorage) {
  $scope.hit = window.hit;
  $scope.bonus_payments = window.bonus_payments;
  $scope.assignments = window.assignments;
});

app.controller('adminTemplatesCtrl', function($scope, Template) {
  $scope.templates = Template.query();

  $scope.delete = function(template) {
    // is this really the best way?
    template.$delete(function() {
      $scope.templates = Template.query();
    });
  };
});
app.controller('adminTemplateCtrl', function($scope, $http, $flash, Template) {
  var current_url = Url.parse(window.location);
  var template_id = _.last(current_url.path.split('/'));

  $scope.template = Template.get({id: template_id});

  $scope.keydown = function(ev) {
    if (ev.which == 83 && ev.metaKey) {
      // command+S
      ev.preventDefault();
      $scope.sync(ev);
    }
  };

  $scope.sync = function(ev) {
    var promise = $scope.template.$save().then(function(res) {
      // refactor this url / history handling somehow
      var template_url = '/admin/templates/' + $scope.template.id;
      history.replaceState(null, '', template_url);
      return 'Saved';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };
});

app.controller('adminAdministratorsCtrl', function($scope, Administrator) {
  $scope.administrators = Administrator.query();
  $scope.delete = function(administrator) {
    administrator.$delete(function() {
      $scope.administrators = Administrator.query();
    });
  };
});

app.controller('adminAdministratorCtrl', function($scope, $http, $flash, $window,
    Administrator, AWSAccount, AWSAccountAdministrator) {
  var current_url = Url.parse(window.location);
  var administrator_id = _.last(current_url.path.split('/'));

  $scope.administrator = Administrator.get({id: administrator_id});
  $scope.aws_accounts = AWSAccount.query();
  $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});

  $scope.sync = function() {
    // var opts = sync_options($scope.administrator);
    var promise = $scope.administrator.$save().then(function(res) {
      return 'Saved';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };

  $scope.unlinkAWSAccount = function(account) {
    account.$delete(function() {
      $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
    });
  };

  $scope.linkAWSAccount = function(account) {
    var administrator_aws_account = new AWSAccountAdministrator(account);
    administrator_aws_account.administrator_id = $scope.administrator.id;
    p('linkAWSAccount', administrator_aws_account, account, $scope.administrator);
    var promise = administrator_aws_account.$save(function() {
      $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
    }).then(function() {
      return 'Saved';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };
});

app.controller('adminAssignmentEditor', function($scope, $http, $flash) {
  $scope.approve = function(assignment, ev) {
    var url = Url.parse(window.location);
    url.path += '/Assignments/' + assignment.AssignmentId + '/Approve';
    var ajax_promise = $http({method: 'POST', url: url}).then(function(res) {
      return res.data.message;
    }, function(res) {
      var headers = res.headers();
      if (headers.location) window.location = headers.location;
      return summarizeResponse(res);
    });
    $flash.addPromise(ajax_promise);
  };
});

app.controller('accessTokensCtrl', function($scope, AccessToken) {
  $scope.access_tokens = AccessToken.query();
  $scope.delete = function(access_token) {
    access_token.$delete(function() {
      $scope.access_tokens = AccessToken.query();
    });
  };
});
