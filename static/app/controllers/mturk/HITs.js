/*jslint browser: true, devel: true */ /*globals _, angular, app, p, Url, summarizeResponse */

app.controller('adminMTurkNavCtrl', function($scope, $localStorage, AWSAccount) {
  $scope.$storage = $localStorage.$default({
    aws_account_id: null,
    host: 'sandbox',
  });
  $scope.aws_accounts = AWSAccount.query();
  $scope.hosts = [{name: 'deploy'}, {name: 'sandbox'}, {name: 'local'}];
});

app.controller('adminHITsCtrl', function($scope, $localStorage, $resource) {
  $scope.$storage = $localStorage.$default({
    aws_account_id: null,
    host: 'sandbox',
  });

  var HIT = $resource('/api/mturk/HITs/:HITId', {
    HITId: '@HITId',
    aws_account_id: $scope.$storage.aws_account_id,
    host: $scope.$storage.host,
  });
  $scope.hits = HIT.query();
});

app.controller('adminHITCtrl', function($scope, $localStorage, $flash, $resource) {
  $scope.$storage = $localStorage.$default({
    aws_account_id: null,
    host: 'sandbox',
  });

  var HIT = $resource('/api/mturk/HITs/:HITId', {
    HITId: '@HITId',
    aws_account_id: $scope.$storage.aws_account_id,
    host: $scope.$storage.host,
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
  });

  var current_url = Url.parse(window.location);
  var HITId = _.last(current_url.path.split('/'));
  $scope.hit = HIT.get({HITId: HITId});
  $scope.bonus_payments = HIT.bonus_payments({HITId: HITId});
  $scope.assignments = HIT.assignments({HITId: HITId});

  $scope.ExtendHIT = function(ev) {
    // var data = _.extend({}, $scope.$storage.hit, $scope.$storage.extra);
    var data = _.extend({HITId: HITId}, $scope.extension);
    // var data = $scope.extension;
    console.log('ExtendHIT data', data, $scope.hit);
    var promise = HIT.ExtendHIT(data).$promise.then(function(res) {
      return 'Extended';
    }, summarizeResponse);
    $flash.addPromise(promise);
  };
});


app.controller('adminCreateHITCtrl', function($scope, $http, $localStorage, $flash) {
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
    var data = _.extend({}, $scope.$storage.hit, $scope.$storage.extra);
    console.log('sync data', data);
    var promise = $http({
      method: 'POST',
      url: '/api/mturk/HITs',
      params: {
        aws_account_id: $scope.$storage.aws_account_id,
        host: $scope.$storage.host,
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
    $flash.addPromise(promise);
  };

  // AWS adds four parameters: assignmentId, hitId, workerId, and turkSubmitTo
  //   turkSubmitTo is the host, not the full path
  $scope.$watch('$storage.hit.ExternalURL', function(newVal, oldVal) {
    if (newVal && newVal !== '' && $scope.$storage.preview_iframe) {
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

app.controller('adminAssignmentEditor', function($scope, $resource, $localStorage, $flash) {
  $scope.$storage = $localStorage.$default({
    aws_account_id: null,
    host: 'sandbox',
  });

  var Assignment = $resource('/api/mturk/Assignments/:AssignmentId', {
    AssignmentId: '@AssignmentId',
    aws_account_id: $scope.$storage.aws_account_id,
    host: $scope.$storage.host,
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

  $scope.approve = function(assignment) {
    var promize = Assignment.Approve({AssignmentId: assignment.AssignmentId}).$promise.then(function(res) {
      return 'Approved';
    }, summarizeResponse);
    $flash.addPromise(promize);
  };

  $scope.reject = function(assignment) {
    var promize = Assignment.Reject({AssignmentId: assignment.AssignmentId}).$promise.then(function(res) {
      return 'Rejected';
    }, summarizeResponse);
    $flash.addPromise(promize);
  };

  $scope.approve_rejected = function(assignment) {
    var promize = Assignment.ApproveRejected({AssignmentId: assignment.AssignmentId}).$promise.then(function(res) {
      return 'Rejected';
    }, summarizeResponse);
    $flash.addPromise(promize);
  };

});
