/*jslint browser: true, esnext: true */
import _ from 'lodash';
import moment from 'moment';
import {app} from '../app';
import {Url} from 'urlobject';
import {CookieMonster} from 'cookiemonster';

var cookies = new CookieMonster(document, {
  path: '/',
  expires: new Date(new Date().getTime() + 31*24*60*60*1000), // one month from now
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

app
.factory('$turk', function($xml, $stateParams) {
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
})
.controller('admin.mturk', function($scope, $state, AWSAccount) {
  // environments
  $scope.environment = $state.params.environment || cookies.get('environment');
  $scope.environments = [{name: 'production'}, {name: 'sandbox'}, {name: 'local'}];
  // aws accounts
  $scope.aws_account_id = $state.params.aws_account_id || cookies.get('aws_account_id');
  $scope.aws_accounts = AWSAccount.query();
  // change watcher called from the view/template
  $scope.changeSetting = function(key, value) {
    cookies.set(key, value);
    $state.go('.', _.object([key], [value]));
  };
})
.controller('admin.mturk.hits.table', function($scope, $state, $turk) {
  $turk({
    Operation: 'SearchHITs',
    SortDirection: 'Descending',
    PageSize: 100,
  }).then(function(res) {
    // res.data is a Document instance.
    $scope.hits = _.map(res.data.querySelectorAll('HIT'), HIT => nodesToJSON(HIT.children));
  });
})
.controller('admin.mturk.hits.new', function($scope, $http, $state, $location, $localStorage, $flash, $turk) {
  $scope.$storage = $localStorage.$default({
    Operation: 'CreateHIT',
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
      Operation: $scope.Operation,
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
      return `Created HIT: ${HITId}`;
    });
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
})
.controller('admin.mturk.hits.edit', function($scope, $localStorage, $state, $q, $flash, $turk) {
  $scope.$storage = $localStorage.$default({
    assignments_limit: 10,
    responses_summarizer: 'return responses;',
    AssignQualification: {
      IntegerValue: 1,
      SendNotification: 1,
    },
  });

  $turk({
    Operation: 'GetHIT',
    HITId: $state.params.HITId,
  }).then(function(res) {
    // res.data is a Document instance, with GetHITResponse as its root element
    var HIT = res.data.querySelector('HIT');
    $scope.hit = nodesToJSON(HIT.children);
  });

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
  });

  $scope.ExtendHIT = function() {
    var data = _.extend({HITId: HITId}, $scope.extension);
    var promise = HIT.ExtendHIT(data).$promise.then(function() {
      return 'Extended';
    });
    $flash(promise);
  };

  $scope.import = function() {
    var promise = HIT.import({HITId: HITId}).$promise.then(function(res) {
      return res.message || 'Imported';
    });
    $flash(promise);
  };

  $turk({
    Operation: 'SearchQualificationTypes',
    MustBeOwnedByCaller: true,
  }).then((res) => {
    $scope.QualificationTypes = _.map(res.data.querySelectorAll('QualificationType'),
      QualificationType => nodesToJSON(QualificationType.children));
  });

  $scope.assignQualifications = () => {
    var AssignQualification = $scope.$storage.AssignQualification;
    var promises = $scope.assignments.map(assignment => {
      return $turk({
        Operation: 'AssignQualification',
        QualificationTypeId: AssignQualification.QualificationTypeId,
        WorkerId: assignment.WorkerId,
        IntegerValue: AssignQualification.IntegerValue,
        SendNotification: AssignQualification.SendNotification,
      });
    });
    var promise = $q.all(promises).then((results) => {
      return `Sent ${results.length} AssignQualification requests`;
    });
    $flash(promise);
  };

})
.directive('assignment', function($state, $localStorage, $turk, $flash, Response) {
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

        var transformed_responses = transform_function(angular.copy(responses));

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
        });
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
        });
        $flash(promise);
      };
    }
  };
})
.controller('admin.mturk.dashboard', function($scope, $localStorage, $state, $flash, $turk) {
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
    });
  };
})
.controller('admin.mturk.qualification_types.new', function($scope, $http, $state, $location, $localStorage, $flash, $turk) {
  $scope.QualificationType = $localStorage.$default({
    QualificationType: {
      RetryDelay: '30m',
      QualificationTypeStatus: 'Active',
      AutoGranted: false,
      AutoGrantedValue: 1,
    }
  }).QualificationType;

  $scope.sync = function() {
    var data = {
      Operation: 'CreateQualificationType',
      Name: $scope.QualificationType.Name,
      Description: $scope.QualificationType.Description,
      Keywords: $scope.QualificationType.Keywords,
      RetryDelayInSeconds: durationStringToSeconds($scope.QualificationType.RetryDelay),
      QualificationTypeStatus: $scope.QualificationType.QualificationTypeStatus,
      Test: $scope.QualificationType.Test,
      TestDuration: $scope.QualificationType.TestDuration,
      AnswerKey: $scope.QualificationType.AnswerKey,
      AutoGranted: $scope.QualificationType.AutoGranted,
      AutoGrantedValue: $scope.QualificationType.AutoGranted ? $scope.QualificationType.AutoGrantedValue : undefined,
    };
    var promise = $turk(data).then(function(res) {
      /**
      res.data is a Document instance; a successful response looks like:

      <CreateQualificationTypeResponse>
        <OperationRequest><RequestId>4936164b-41e9-45be-9189-b43fdf973e1d</RequestId></OperationRequest>
        <QualificationType>
          <Request><IsValid>True</IsValid></Request>
          <QualificationTypeId>33MAVWP2GREQRM6IPUX4EU7SU2KZL1</QualificationTypeId>
          <CreationTime>2015-07-09T00:39:15Z</CreationTime>
          <Name>Test qualification 1</Name>
          <Description>My first qualification type (it's temporary)</Description>
          <Keywords>test,autogrant</Keywords>
          <QualificationTypeStatus>Active</QualificationTypeStatus>
          <RetryDelayInSeconds>1800</RetryDelayInSeconds>
          <AutoGranted>1</AutoGranted>
          <AutoGrantedValue>1</AutoGrantedValue>
        </QualificationType>
      </CreateQualificationTypeResponse>

      An error response looks like:

      <CreateQualificationTypeResponse>
        <OperationRequest><RequestId>f8504a5e-00ab-4208-b069-7917bba88871</RequestId></OperationRequest>
        <QualificationType>
          <Request>
            <IsValid>False</IsValid>
            <Errors>
              <Error>
                <Code>AWS.MechanicalTurk.QualificationTypeAlreadyExists</Code>
                <Message>
                  You have already created a QualificationType with this name. A QualificationType's name must be unique among all of the QualificationTypes created by the same user. (1436402412782)
                </Message>
                <Data>
                  <Key>QualificationTypeId</Key>
                  <Value>33MAVWP2GREQRM6IPUX4EU7SU2KZL1</Value>
                </Data>
                <Data>
                  <Key>QualificationTypeId</Key>
                  <Value>33MAVWP2GREQRM6IPUX4EU7SU2KZL1</Value>
                </Data>
              </Error>
            </Errors>
          </Request>
        </QualificationType>
      </CreateQualificationTypeResponse>
      */
      var success = res.data.querySelector('IsValid').textContent === 'True';
      if (success) {
        var QualificationTypeId = res.data.querySelector('QualificationTypeId').textContent;
        return `Created QualificationType: ${QualificationTypeId}`;
      }
      else {
        var message = res.data.querySelector('Errors > Error > Message').textContent;
        return `Failure: ${message}`;
      }
    });
    $flash(promise);
  };
})
.controller('admin.mturk.qualification_types.edit', function($scope, $state, $turk) {
  $turk({
    Operation: 'GetQualificationType',
    QualificationTypeId: $state.params.QualificationTypeId,
  }).then(function(res) {
    // res.data is a Document instance.
    $scope.QualificationType = nodesToJSON(res.data.querySelector('QualificationType').children);
  });

  $turk({
    Operation: 'GetQualificationsForQualificationType',
    QualificationTypeId: $state.params.QualificationTypeId,
    // Status: 'Granted' | 'Revoked',
    PageSize: 100,
    PageNumber: 1,
  }).then(function(res) {
    /**
    Success looks like:

    <GetQualificationsForQualificationTypeResponse>
      <OperationRequest><RequestId>5e57d866-70e2-4e76-a1ce-f0b28e69977b</RequestId></OperationRequest>
      <GetQualificationsForQualificationTypeResult>
        <Request><IsValid>True</IsValid></Request>
        <NumResults>20</NumResults>
        <TotalNumResults>20</TotalNumResults>
        <PageNumber>1</PageNumber>
        <Qualification>
          <QualificationTypeId>3C8RUX4LESAVRD6QL84K1JKOF4LM9A</QualificationTypeId>
          <SubjectId>AHM21AWBZPEJNM</SubjectId>
          <GrantTime>2015-07-08T21:16:39.000-07:00</GrantTime>
          <IntegerValue>1</IntegerValue>
          <Status>Granted</Status>
        </Qualification>
        <Qualification>
          <QualificationTypeId>3C8RUX4LESAVRD6QL84K1JKOF4LM9A</QualificationTypeId>
          <SubjectId>APOLZKWYE7JF6B</SubjectId>
          <GrantTime>2015-07-08T21:16:39.000-07:00</GrantTime>
          <IntegerValue>1</IntegerValue>
          <Status>Granted</Status>
        </Qualification>
      </GetQualificationsForQualificationTypeResult>
    </GetQualificationsForQualificationTypeResponse>
    */
    $scope.Qualifications = _.map(res.data.querySelectorAll('Qualification'),
      Qualification => nodesToJSON(Qualification.children));
  });
})
.controller('admin.mturk.qualification_types.table', function($scope, $localStorage, $turk, $flash) {
  $scope.SearchQualificationTypes = $localStorage.$default({
    SearchQualificationTypes: {
      Operation: 'SearchQualificationTypes',
      SortProperty: 'Name', // default, only option, not required
      SortDirection: 'Ascending',
      PageSize: 10,
      PageNumber: 1,
      MustBeRequestable: false,
      MustBeOwnedByCaller: true,
    }
  }).SearchQualificationTypes;

  $scope.refresh = () => {
    var data = $scope.SearchQualificationTypes;
    if (data.Query === '') {
      data.Query = null;
    }
    $turk(data).then(function(res) {
      // res.data is a Document instance.
      $scope.QualificationTypes = _.map(res.data.querySelectorAll('QualificationType'),
        QualificationType => nodesToJSON(QualificationType.children));
    });
  };

  $scope.refresh();

  $scope.delete = (QualificationType) => {
    var promise = $turk({
      Operation: 'DisposeQualificationType',
      QualificationTypeId: QualificationType.QualificationTypeId,
    }).then((res) => {
      /**
      On success:

      <DisposeQualificationTypeResponse>
        <OperationRequest><RequestId>9dfced88-390e-43ba-b0a6-db0fd8bf32a6</RequestId></OperationRequest>
        <DisposeQualificationTypeResult>
          <Request>
            <IsValid>True</IsValid>
          </Request>
        </DisposeQualificationTypeResult>
      </DisposeQualificationTypeResponse>

      On failure:

      <DisposeQualificationTypeResponse>
        <OperationRequest><RequestId>4d4f425d-1a25-47ab-ae10-f801c02fab33</RequestId></OperationRequest>
        <DisposeQualificationTypeResult>
          <Request>
            <IsValid>False</IsValid>
            <Errors>
              <Error>
                <Code>AWS.MechanicalTurk.InvalidQualificationTypeState</Code>
                <Message>
                  This operation can be called with a status of: Active,Inactive (1436410660581)
                </Message>
                <Data>
                  <Key>QualificationTypeId</Key>
                  <Value>3IUNFP8DKUS0R71E78UIQ0J2B48LJ3</Value>
                </Data>
                <Data>
                  <Key>CurrentState</Key>
                  <Value>Disposing</Value>
                </Data>
                <Data>
                  <Key>ExpectedStates</Key>
                  <Value>Active,Inactive</Value>
                </Data>
                <Data>
                  <Key>ExpectedStates</Key>
                  <Value>Active,Inactive</Value>
                </Data>
                <Data>
                  <Key>QualificationTypeId</Key>
                  <Value>3IUNFP8DKUS0R71E78UIQ0J2B48LJ3</Value>
                </Data>
              </Error>
            </Errors>
          </Request>
        </DisposeQualificationTypeResult>
      </DisposeQualificationTypeResponse>
      */
      var success = res.data.querySelector('IsValid').textContent === 'True';
      if (success) {
        $scope.QualificationTypes.splice($scope.QualificationTypes.indexOf(QualificationType), 1);
        return `Deleted QualificationType: ${QualificationType.QualificationTypeId}`;
      }
      else {
        var message = res.data.querySelector('Errors > Error > Message').textContent;
        return `Failure: ${message}`;
      }
    });
    $flash(promise);
  };
});
