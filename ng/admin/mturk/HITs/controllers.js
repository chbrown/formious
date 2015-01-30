/*jslint browser: true */ /*globals _, angular, app, Url, summarizeResponse */

app.service('$storedStateParams', function($state, $localStorage, $rootScope) {
  // bring in localStorage backing and automatic re-routing to reflect params changes
  var params = angular.copy($state.params);
  var last_params = angular.copy(params);

  // _.pick ... _.defaults doesn't cut it because we want to replace both
  // null and undefined and _.extend doesn't ignore null or undefined values
  for (var key in params) {
    // try to grab defaults for the current state's null params from local storage
    // the way ui.router is set up, params[k] will never be undefined
    if ($state.params[key] === null && $localStorage[key] !== null && $localStorage[key] !== undefined) {
      params[key] = $localStorage[key];
    }
  }

  function digest() {
    if (!angular.equals(params, last_params)) {
      _.extend($localStorage, params);
      // actually only need to copy if the $state.go doesn't trigger a controller reload
      last_params = angular.copy(params);
      $state.go('.', params);
    }
  }
  digest();

  var _debounce;
  $rootScope.$watch(function() {
    if (!_debounce) {
      _debounce = setTimeout(function() {
        _debounce = null;
        digest();
      }, 100);
    }
  });

  return params;
});

app.controller('adminMTurkNavCtrl', function($scope, $storedStateParams, AWSAccount) {
  $scope.params = $storedStateParams;

  $scope.aws_accounts = AWSAccount.query();
  $scope.hosts = [{name: 'deploy'}, {name: 'sandbox'}, {name: 'local'}];
});

app.controller('adminHITsCtrl', function($scope, $resource, $stateParams, $storedStateParams) {
  $scope.params = $storedStateParams;
  var HIT = $resource('/api/mturk/HITs/:HITId', {
    HITId: '@HITId',
    aws_account_id: $scope.params.aws_account_id,
    host: $scope.params.host,
  });
  $scope.hits = HIT.query();
});

app.controller('adminHITCtrl', function($scope, $flash, $resource, $storedStateParams) {
  var HIT = $resource('/api/mturk/HITs/:HITId', {
    HITId: '@HITId',
    aws_account_id: $storedStateParams.aws_account_id,
    host: $storedStateParams.host,
  }, {
    bonus_payments: {
      method: 'GET',
      url: '/api/mturk/HITs/:HITId/BonusPayments',
      isArray: true,
    },
    assignments: {
      method: 'GET',
      url: '/api/mturk/HITs/:HITId/Assignments',
      isArray: true,
    },
    ExtendHIT: {
      method: 'POST',
      url: '/api/mturk/HITs/:HITId/ExtendHIT',
    },
    import: {
      method: 'POST',
      url: '/api/mturk/HITs/:HITId/import',
    },
  });

  var HITId = $storedStateParams.HITId;
  $scope.hit = HIT.get({HITId: HITId});
  $scope.bonus_payments = HIT.bonus_payments({HITId: HITId});
  $scope.assignments = HIT.assignments({HITId: HITId});

  $scope.ExtendHIT = function(ev) {
    var data = _.extend({HITId: HITId}, $scope.extension);
    // console.log('ExtendHIT data', data, $scope.hit);
    var promise = HIT.ExtendHIT(data).$promise.then(function(res) {
      return 'Extended';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.import = function(ev) {
    var promise = HIT.import({HITId: HITId}).$promise.then(function(res) {
      return res.message || 'Imported';
    }, summarizeResponse);
    $flash(promise);
  };
});


app.controller('adminCreateHITCtrl', function($scope, $http, $location, $localStorage, $flash, $storedStateParams) {
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

  // experiment/show may send over ExternalURL and Title query params
  // fixme: the way we grab the variables off here before the state redirects is kind of a hack
  var query = $location.search();
  _.extend($scope.$storage.hit, _.omit(query, 'aws_account_id', 'host'));

  $scope.sync = function(ev) {
    var data = _.extend({}, $scope.$storage.hit, $scope.$storage.extra);
    // console.log('sync data', data);
    var promise = $http({
      method: 'POST',
      url: '/api/mturk/HITs',
      params: {
        aws_account_id: $storedStateParams.aws_account_id,
        host: $storedStateParams.host,
      },
      data: data,
    }).then(function(res) {
      var headers = res.headers();
      if (headers.location) {
        setTimeout(function() {
          window.location = headers.location;
        }, 3000);
        return 'Created, navigating to HIT page in 3 seconds.';
      }
      else {
        return 'Created';
      }
    }, summarizeResponse);
    $flash(promise);
  };

  // AWS adds four parameters: assignmentId, hitId, workerId, and turkSubmitTo
  //   turkSubmitTo is the host, not the full path
  $scope.$watch('$storage.hit.ExternalURL', function(newVal, oldVal) {
    if (newVal !== '') {
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
      $scope.preview_url = url.toString();
    }
    else {
      $scope.preview_url = '';
    }
  });
});

app.controller('adminAssignmentEditor', function($scope, $resource, $storedStateParams, $flash) {
  var Assignment = $resource('/api/mturk/Assignments/:AssignmentId', {
    AssignmentId: '@AssignmentId',
    aws_account_id: $storedStateParams.aws_account_id,
    host: $storedStateParams.host,
  }, {
    Approve: {
      method: 'POST',
      url: '/api/mturk/ApproveAssignment',
    },
    Reject: {
      method: 'POST',
      url: '/api/mturk/RejectAssignment',
    },
    ApproveRejected: {
      method: 'POST',
      url: '/api/mturk/ApproveRejectedAssignment',
    },
  });

  $scope.approve = function(assignment_id) {
    var promise = Assignment.Approve({AssignmentId: assignment_id}).$promise.then(function(res) {
      return 'Approved';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.reject = function(assignment_id) {
    var promise = Assignment.Reject({AssignmentId: assignment_id}).$promise.then(function(res) {
      return 'Rejected';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.approve_rejected = function(assignment_id) {
    var promise = Assignment.ApproveRejected({AssignmentId: assignment_id}).$promise.then(function(res) {
      return 'Rejected';
    }, summarizeResponse);
    $flash(promise);
  };

});
