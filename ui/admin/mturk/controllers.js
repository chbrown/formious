/*jslint browser: true */ /*globals _, angular, app, Url, moment, summarizeResponse */

app.factory('$turk', function($xml, $stateParams) {
  return function(data) {
    return $xml({
      method: 'POST',
      url: '/api/mturk',
      params: {
        aws_account_id: $stateParams.aws_account_id,
        environment: $stateParams.environment,
      },
      data: data,
    });
  };
});

function nodesToJSON(nodes) {
  var pairs = _.map(nodes, function(node) {
    var hasChildren = node.children && node.children.length > 0;
    return [node.tagName, hasChildren ? nodesToJSON(node.children) : node.textContent];
  });
  return _.zipObject(pairs);
}

function parseAnswer(answer_escaped) {
  /**
  Example Answer document, unescaped:

      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <QuestionFormAnswers xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionFormAnswers.xsd">
        <Answer>
          <QuestionIdentifier>block_id</QuestionIdentifier>
          <FreeText>1038</FreeText>
        </Answer>
        <Answer>
          <QuestionIdentifier>feedback_guess_percentage</QuestionIdentifier>
          <FreeText>20</FreeText>
        </Answer>
        <Answer>
          <QuestionIdentifier>feedback_confident_percentage</QuestionIdentifier>
          <FreeText>20</FreeText>
        </Answer>
        <Answer>
          <QuestionIdentifier>feedback_general</QuestionIdentifier>
          <FreeText>I would love to see the answers between questions.</FreeText>
        </Answer>
      </QuestionFormAnswers>

  Returns a plain object like:

      {
        block_id: "1038",
        feedback_guess_percentage: "20",
        feedback_confident_percentage: "20",
        feedback_general: "I would love to see the answers between questions.",
      }
  */
  var answer_xml = answer_escaped.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  var answer_doc = new DOMParser().parseFromString(answer_xml, 'text/xml');
  var pairs = _.map(answer_doc.querySelectorAll('Answer'), function(Answer) {
    return [Answer.querySelector('QuestionIdentifier').textContent,
      Answer.querySelector('FreeText').textContent];
  });
  return _.zipObject(pairs);
}

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

app.controller('admin.mturk', function($scope, $state, AWSAccount) {
  // environments
  $scope.environment = $state.params.environment;
  $scope.environments = [{name: 'production'}, {name: 'sandbox'}, {name: 'local'}];
  // aws accounts
  $scope.aws_account_id = $state.params.aws_account_id;
  $scope.aws_accounts = AWSAccount.query();
  // on change watcher
  $scope.$watchGroup(['environment', 'aws_account_id'], function() {
    $state.go('.', {environment: $scope.environment, aws_account_id: $scope.aws_account_id});
  });
});

app.controller('admin.mturk.hits.table', function($scope, $state, $turk) {
  $turk({
    Operation: 'SearchHITs',
    SortDirection: 'Descending',
    PageSize: 100,
  }).then(function(res) {
    // res.data is a Document instance.
    $scope.hits = _.map(res.data.querySelectorAll('HIT'), function(HIT) {
      return nodesToJSON(HIT.children);
    });
  }, summarizeResponse);
});

app.controller('admin.mturk.hits.new', function($scope, $http, $state, $location, $localStorage, $flash, $turk) {
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
    var promise = $turk(data).then(function(res) {
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
      // var HITTypeId = res.data.querySelector('HITTypeId').textContent;
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

app.controller('admin.mturk.hits.edit', function($scope, $localStorage, $state, $flash, $turk) {
  $scope.$storage = $localStorage.$default({
    assignments_limit: 10,
    responses_summarizer: 'return responses;',
  });
  $turk({
    Operation: 'GetHIT',
    HITId: $state.params.HITId,
  }).then(function(res) {
    // res.data is a Document instance, with GetHITResponse as its root element
    var HIT = res.data.querySelector('HIT');
    $scope.hit = nodesToJSON(HIT.children);
  }, summarizeResponse);

  $turk({
    Operation: 'GetAssignmentsForHIT',
    HITId: $state.params.HITId,
    PageSize: 100,
    SortProperty: 'SubmitTime',
    SortDirection: 'Ascending',
  }).then(function(res) {
    // res.data is a Document instance, with GetAssignmentsForHITResponse as its root element
    $scope.assignments = _.map(res.data.querySelectorAll('Assignment'), function(Assignment) {
      var assignment_json = nodesToJSON(Assignment.children);
      assignment_json.Answer = parseAnswer(assignment_json.Answer);
      return assignment_json;
    });
  }, summarizeResponse);

  // participant.duration = responses[0].duration.toFixed(0) + ' seconds';

  // var xml = new XMLSerializer().serializeToString(res.data);
  // console.log(xml);

  // var aws_worker_ids = assignments.map(function(assignment) {
  //   return assignment.WorkerId;
  // });

    // bonus_payments: {
    //   method: 'GET',
    //   url: '/api/mturk/HITs/:HITId/BonusPayments',
    //   isArray: true,
    // },
    // ExtendHIT: {
    //   method: 'POST',
    //   url: '/api/mturk/HITs/:HITId/ExtendHIT',
    // },
    // import: {
    //   method: 'POST',
    //   url: '/api/mturk/HITs/:HITId/import',
    // },

  // $scope.bonus_payments = HIT.bonus_payments({HITId: HITId});

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

app.directive('assignment', function($state, $localStorage, $turk, $flash, Response) {
  return {
    restrict: 'A',
    templateUrl: '/ui/admin/mturk/assignment.html',
    scope: {
      assignment: '=',
    },
    link: function(scope) {
      scope.$storage = $localStorage;
      var responses = Response.query({aws_worker_id: scope.assignment.WorkerId}, function() {
        var transform_functionBody = $localStorage.responses_summarizer || 'return responses;';
        var transform_function = new Function('responses', transform_functionBody);

        // console.log('transform_function:', transform_function.toString());
        var transformed_responses = transform_function(angular.copy(responses));
        // console.log('transformed_responses', transformed_responses);

        scope.responses = transformed_responses;
      });

      scope.blockWorker = function(Reason) {
        var promise = $turk({
          Operation: 'BlockWorker',
          WorkerId: scope.assignment.WorkerId,
          Reason: Reason,
        }).then(function(res) {
          var xml = new XMLSerializer().serializeToString(res.data);
          console.log('BlockWorker response', xml);
          return xml;
        }, summarizeResponse);
        $flash(promise);
      };

      scope.setStatus = function(prefix) {
        // prefix should be one of 'Approve' | 'Reject' | 'ApproveRejected'
        var promise = $turk({
          Operation: prefix + 'Assignment',
          AssignmentId: scope.assignment.AssignmentId,
          RequesterFeedback: scope.RequesterFeedback,
        }).then(function(res) {
          var xml = new XMLSerializer().serializeToString(res.data);
          console.log('setStatus response', xml);
          return xml;

          // return $turk({
          //   Operation: 'GetAssignment',
          //   AssignmentId: scope.assignment.AssignmentId,
          // }).then(function(res) {
          //   scope.assignment =
          //   return 'Updated Assignment';
          // });
        }, summarizeResponse);
        $flash(promise);
      };
    }
  };
});

app.controller('admin.mturk.dashboard', function($scope, $localStorage, $state, $flash, $turk) {
  // $scope.$storage = $localStorage.$default({
  //   assignments_limit: 10,
  //   responses_summarizer: 'return responses;',
  $scope.NotifyWorkers = function() {
    $turk({
      Operation: 'NotifyWorkers',
      Subject: $scope.notification.Subject,
      MessageText: $scope.notification.MessageText,
      WorkerId: $scope.notification.WorkerId,
    }).then(function(res) {
      // res.data is a Document instance.
      var xml = new XMLSerializer().serializeToString(res.data);
      console.log(xml);
    }, summarizeResponse);
  };
});
