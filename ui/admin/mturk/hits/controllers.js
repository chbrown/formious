/*jslint browser: true */ /*globals _, angular, app, Url, moment, summarizeResponse */

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

app.controller('admin.mturk', function($scope, $storedStateParams, AWSAccount) {
  $scope.params = $storedStateParams;

  $scope.aws_accounts = AWSAccount.query();
  $scope.environments = [{name: 'production'}, {name: 'sandbox'}, {name: 'local'}];
});

app.controller('admin.mturk.hits.table', function($scope, $resource, $stateParams, $storedStateParams) {
  $scope.params = $storedStateParams;

  var HIT = $resource('/api/mturk/hits/:HITId', {
    HITId: '@HITId',
    aws_account_id: $scope.params.aws_account_id,
    environment: $scope.params.environment,
  });
  $scope.hits = HIT.query();
});

app.controller('admin.mturk.hits.edit', function($scope, $flash, $resource, $storedStateParams) {
  var HIT = $resource('/api/mturk/HITs/:HITId', {
    HITId: '@HITId',
    aws_account_id: $storedStateParams.aws_account_id,
    environment: $storedStateParams.environment,
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

  $scope.ExtendHIT = function() {
    var data = _.extend({HITId: HITId}, $scope.extension);
    var promise = HIT.ExtendHIT(data).$promise.then(function() {
      return 'Extended';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.import = function() {
    var promise = HIT.import({HITId: HITId}).$promise.then(function(res) {
      return res.message || 'Imported';
    }, summarizeResponse);
    $flash(promise);
  };
});

function durationStringToSeconds(s) {
  // takes a string like "5h" and returns 5*60*60, the number of seconds in five hours
  var matches = s.match(/\d+\w/g);
  var duration = moment.duration(0);
  matches.forEach(function(match) {
    var parts = match.match(/(\d+)(\w)/);
    duration.add(parseInt(parts[1], 10), parts[2]);
  });
  return duration.asSeconds();
}

function createExternalQuestionString(ExternalURL, FrameHeight) {
  var xmlns = 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd';
  // var report = document.implementation.createDocument(null, "report", null);
  var doc = document.implementation.createDocument(xmlns, 'ExternalQuestion');
  var ExternalURL_el = doc.documentElement.appendChild(doc.createElement('ExternalURL'));
  ExternalURL_el.textContent = ExternalURL;
  var FrameHeight_el = doc.documentElement.appendChild(doc.createElement('FrameHeight'));
  FrameHeight_el.textContent = FrameHeight;
  return new XMLSerializer().serializeToString(doc);
}

app.controller('admin.mturk.hits.new', function($scope, $http, $state, $location, $localStorage, $flash, $xml) {
  $scope.$storage = $localStorage.$default({
    Title: $state.params.Title || 'Exciting task!',
    // Description: 'Look at some cool pictures and answer a lot of really easy questions.',
    MaxAssignments: 20,
    Reward: 0.05,
    Keywords: 'research,science',
    AssignmentDuration: '2h',
    Lifetime: '12h',
    AutoApprovalDelay: '48h',
    // experiment/show may send over ExternalURL and Title query params
    ExternalURL: $state.params.ExternalURL || '/experiments/MISSING',
    FrameHeight: 550,
    preview_iframe: false,
  });

  $scope.sync = function() {
    var Question = createExternalQuestionString($scope.$storage.ExternalURL, $scope.$storage.FrameHeight);
    var data = {
      Operation: 'CreateHIT',
      Title: $scope.$storage.Title,
      Description: $scope.$storage.Description,
      MaxAssignments: $scope.$storage.MaxAssignments,
      Reward: {
        Amount: $scope.$storage.Reward,
        CurrencyCode: 'USD',
      },
      Keywords: $scope.$storage.Keywords,
      Question: Question,
      AssignmentDurationInSeconds: durationStringToSeconds($scope.$storage.AssignmentDuration),
      LifetimeInSeconds: durationStringToSeconds($scope.$storage.Lifetime),
      AutoApprovalDelayInSeconds: durationStringToSeconds($scope.$storage.AutoApprovalDelay),
    };
    _.extend(data, $scope.$storage.extra);
    var promise = $xml({
      method: 'POST',
      url: '/api/mturk',
      params: {
        aws_account_id: $state.params.aws_account_id,
        environment: $state.params.environment,
      },
      data: data,
    }).then(function(res) {
      /**
      res.data is a Document instance; a successful response looks like:

      <?xml version="1.0"?>
      <CreateHITResponse>
        <OperationRequest><RequestId>3fb91ca0-8df3-b65b-6cc4-b84205e11e5c</RequestId></OperationRequest>
        <HIT>
          <Request><IsValid>True</IsValid></Request>
          <HITId>3WV80UW08Y4VD8LBFL8W0CY4E4CW55</HITId>
          <HITTypeId>3I47MBBHDSXH4CD71VX6NB5EWOFB6N</HITTypeId>
        </HIT>
      </CreateHITResponse>
      */
      var HITId = res.data.querySelector('HITId').textContent;
      var HITTypeId = res.data.querySelector('HITTypeId').textContent;
      $state.go('admin.mturk.hits.edit', {HITId: HITId});
      return 'Created HIT: ' + HITId;
    }, summarizeResponse);
    $flash(promise);
  };

  // AWS adds four parameters: assignmentId, hitId, workerId, and turkSubmitTo
  //   turkSubmitTo is the host, not the full path
  $scope.$watch('$storage.hit.ExternalURL', function(newVal) {
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
    environment: $storedStateParams.environment,
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
    var promise = Assignment.Approve({AssignmentId: assignment_id}).$promise.then(function() {
      return 'Approved';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.reject = function(assignment_id) {
    var promise = Assignment.Reject({AssignmentId: assignment_id}).$promise.then(function() {
      return 'Rejected';
    }, summarizeResponse);
    $flash(promise);
  };

  $scope.approve_rejected = function(assignment_id) {
    var promise = Assignment.ApproveRejected({AssignmentId: assignment_id}).$promise.then(function() {
      return 'Rejected';
    }, summarizeResponse);
    $flash(promise);
  };

});
