import _ from 'lodash'
import angular from 'angular'
import {app, sendTurkRequest} from '../app'
import {Url} from 'urlobject'
import {CookieMonster} from 'cookiemonster'
import {NotifyUI} from 'notify-ui'

const cookie_defaults = {
  path: '/',
  expires: new Date(new Date().getTime() + 31 * 24 * 60 * 60 * 1000), // one month from now
}

function nodesToJSON(nodes) {
  var pairs = [...nodes].map(node => {
    if (node.children && node.children.length > 0) {
      return [node.tagName, nodesToJSON(node.children)]
    }
    else {
      var value = node.textContent
      if (/^-?[0-9]*\.[0-9]+$/.test(value)) {
        value = parseFloat(value)
      }
      else if (/^-?[0-9]+$/.test(value)) {
        value = parseInt(value, 10)
      }
      return [node.tagName, value]
    }
  })
  return _.zipObject(pairs)
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
  var answer_xml = answer_escaped.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  var answer_doc = new DOMParser().parseFromString(answer_xml, 'text/xml')
  var pairs = [...answer_doc.querySelectorAll('Answer')].map(function(Answer) {
    var key = Answer.querySelector('QuestionIdentifier').textContent
    // TODO: handle other types of values besides FreeText
    var value = Answer.querySelector('FreeText').textContent
    return [key, value]
  })
  return _.zipObject(pairs)
}

function createExternalQuestionString(ExternalURL, FrameHeight) {
  var xmlns = 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd'
  var doc = document.implementation.createDocument(xmlns, 'ExternalQuestion')
  var ExternalURL_el = doc.documentElement.appendChild(doc.createElement('ExternalURL'))
  ExternalURL_el.textContent = ExternalURL
  var FrameHeight_el = doc.documentElement.appendChild(doc.createElement('FrameHeight'))
  FrameHeight_el.textContent = FrameHeight
  return new XMLSerializer().serializeToString(doc)
}

class QualificationType {
  static query(data, callback) {
    sendTurkRequest({
      Operation: 'SearchQualificationTypes',
      MustBeOwnedByCaller: true,
      ...data,
    }, callback)
  }
  static get(data, callback) {
    if (data.QualificationTypeId === undefined) {
      setTimeout(() => callback(new Error('The QualificationTypeId parameter is required')), 0)
    }
    sendTurkRequest({Operation: 'GetQualificationType', ...data}, callback)
  }
  static assign(data, callback) {
    if (data.QualificationTypeId === undefined) {
      setTimeout(() => callback(new Error('The QualificationTypeId parameter is required')), 0)
    }
    if (data.WorkerId === undefined) {
      setTimeout(() => callback(new Error('The WorkerId parameter is required')), 0)
    }
    sendTurkRequest({
      Operation: 'AssignQualification',
      IntegerValue: 1,
      SendNotification: false,
      ...data,
    }, callback)
  }
  static revoke(data, callback) {
    var {
      Operation = 'RevokeQualification',
      SubjectId,
      QualificationTypeId,
      Reason,
    } = data
    if (QualificationTypeId === undefined) {
      setTimeout(() => callback(new Error('The QualificationTypeId parameter is required')), 0)
    }
    if (SubjectId === undefined) {
      setTimeout(() => callback(new Error('The SubjectId parameter is required')), 0)
    }
    sendTurkRequest({Operation, SubjectId, QualificationTypeId, Reason}, callback)
  }
  static update(data, callback) {
    var {
      Operation = 'UpdateQualificationType',
      QualificationTypeId,
      RetryDelayInSeconds,
      QualificationTypeStatus,
      Description,
      Test,
      AnswerKey,
      TestDurationInSeconds,
      AutoGranted,
      AutoGrantedValue,
    } = data
    if (QualificationTypeId === undefined) {
      setTimeout(() => callback(new Error('The QualificationTypeId parameter is required')), 0)
    }
    if (AutoGranted === 0) {
      AutoGrantedValue = undefined
    }
    sendTurkRequest({
      Operation,
      QualificationTypeId,
      RetryDelayInSeconds,
      QualificationTypeStatus,
      Description,
      Test,
      AnswerKey,
      TestDurationInSeconds,
      AutoGranted,
      AutoGrantedValue,
    }, callback)
  }
}

app
.controller('admin.mturk', function($scope, $state, AWSAccount) {
  // TODO: improve interface between cookies and $state
  var cookies = new CookieMonster(document, cookie_defaults)
  // environment
  if ($state.params.environment === '' && cookies.get('environment')) {
    $state.go('.', {environment: cookies.get('environment')})
  }
  $scope.environment = $state.params.environment
  $scope.environments = [{name: 'production'}, {name: 'sandbox'}, {name: 'local'}]
  // aws accounts
  if ($state.params.aws_account_id === '' && cookies.get('aws_account_id')) {
    $state.go('.', {aws_account_id: cookies.get('aws_account_id')})
  }
  $scope.aws_account_id = $state.params.aws_account_id
  $scope.aws_accounts = AWSAccount.query()
  // change watcher called from the view/template
  $scope.changeSetting = function(key, value) {
    cookies.set(key, value)
    $state.go('.', _.object([key], [value]))
  }
})
.controller('admin.mturk.hits.table', function($scope, $state, $turk) {
  $turk({
    Operation: 'SearchHITs',
    SortDirection: 'Descending',
    PageSize: 100,
  }).then(function(document) {
    $scope.hits = [...document.querySelectorAll('HIT')].map(HIT => nodesToJSON(HIT.children))
  })
})
.controller('admin.mturk.hits.new', function($scope, $http, $location, $sce, $state, $localStorage, $turk) {
  $scope.$storage = $localStorage.$default({
    Operation: 'CreateHIT',
    Title: $state.params.Title || 'Exciting task!',
    // Description: 'Look at some cool pictures and answer a lot of really easy questions.',
    MaxAssignments: 20,
    Reward: 0.05,
    Keywords: 'research,science',
    AssignmentDurationInSeconds: 2 * 60 * 60, // 2h
    LifetimeInSeconds: 12 * 60 * 60, // 12h
    AutoApprovalDelayInSeconds: 2 * 24 * 60 * 60, // 2d
    // experiment/show may send over ExternalURL and Title query params
    ExternalURL: $state.params.ExternalURL || '/experiments/MISSING',
    FrameHeight: 550,
    preview_iframe: false,
  })

  $scope.sync = function() {
    var Question = createExternalQuestionString($scope.$storage.ExternalURL, $scope.$storage.FrameHeight)
    var {
      Operation,
      Title,
      Description,
      MaxAssignments,
      Reward,
      Keywords,
      AssignmentDurationInSeconds,
      LifetimeInSeconds,
      AutoApprovalDelayInSeconds,
    } = $scope.$storage
    var data = {
      Operation,
      Title,
      Description,
      MaxAssignments,
      Reward: {
        Amount: Reward,
        CurrencyCode: 'USD',
      },
      Keywords,
      Question,
      AssignmentDurationInSeconds,
      LifetimeInSeconds,
      AutoApprovalDelayInSeconds,
    }
    Object.assign(data, $scope.$storage.extra)
    var promise = $turk(data).then(function(document) {
      var HITId = document.querySelector('HITId').textContent
      // var HITTypeId = document.querySelector('HITTypeId').textContent
      $state.go('admin.mturk.hits.edit', {HITId: HITId})
      return `Created HIT: ${HITId}`
    })
    NotifyUI.addPromise(promise)
  }

  // AWS adds four parameters: assignmentId, hitId, workerId, and turkSubmitTo
  //   turkSubmitTo is the host, not the full path
  $scope.$watch('$storage.ExternalURL', function(ExternalURL) {
    if (ExternalURL !== '') {
      var url = Url.parse(ExternalURL)
      Object.assign(url.query, {
        // Once assigned, assignmentId is a 30-character alphadecimal mess
        // assignmentId: 'ASSIGNMENT_ID_NOT_AVAILABLE',
        assignmentId: '1234567890abcdef',
        hitId: '0PREVIEWPREVIEWPREVIEWPREVIEW9',
        workerId: 'A1234TESTING',
        // turkSubmitTo is normally https://workersandbox.mturk.com or https://www.mturk.com
        turkSubmitTo: '',
      })
      $scope.preview_url = $sce.trustAsResourceUrl(url.toString())
    }
    else {
      $scope.preview_url = null
    }
  })
})
.controller('admin.mturk.hits.edit', function($scope, $localStorage, $state, $q, $turk, Response) {
  $scope.$storage = $localStorage.$default({
    assignments_limit: 10,
    responses_summarizer: 'return responses;',
    AssignQualification: {
      IntegerValue: 1,
      SendNotification: 1,
    },
  })

  var HITId = $state.params.HITId

  $turk({
    Operation: 'GetHIT',
    HITId,
  }).then(function(document) {
    // document is a Document instance with GetHITResponse as its root element
    var HIT = document.querySelector('HIT')
    $scope.hit = nodesToJSON(HIT.children)
  })

  $turk({
    Operation: 'GetAssignmentsForHIT',
    HITId,
    PageSize: 100,
    SortProperty: 'SubmitTime',
    SortDirection: 'Ascending',
  }).then(document => {
    // document is a Document instance, with GetAssignmentsForHITResponse as its root element
    $scope.assignments = [...document.querySelectorAll('Assignment')].map(Assignment => {
      var assignment_json = nodesToJSON(Assignment.children)
      assignment_json.Answer = parseAnswer(assignment_json.Answer)
      return assignment_json
    })
  })

  $scope.ExtendHIT = function() {
    var {MaxAssignmentsIncrement, ExpirationIncrementInSeconds} = $scope.extension
    var promise = $turk({
      Operation: 'ExtendHIT',
      HITId,
      MaxAssignmentsIncrement,
      ExpirationIncrementInSeconds,
    }).then(ExtendHITResponse => {
      console.log('ExtendHITResponse', ExtendHITResponse)
      return 'Extended'
    })
    NotifyUI.addPromise(promise, 'Extending HIT')
  }

  $scope.import = function() {
    var promises = $scope.assignments.map(assignment => {
      const {HITId, AutoApprovalTime, AcceptTime, SubmitTime, ApprovalTime} = assignment
      var params = Object.assign({
        value: {HITId, AutoApprovalTime, AcceptTime, SubmitTime, ApprovalTime},
        assignment_id: assignment.AssignmentId,
        // block_id isn't required, but if it's provided, it had better be an actual stim!
        block_id: assignment.Answer.block_id,
        aws_worker_id: assignment.WorkerId,
      }, assignment.Answer)
      console.log('assignment params', params)

      var response = new Response(params)
      return response.$save().then(res => {
        return {response: res}
      }, res => {
        // err.message.match(/duplicate key value violates unique constraint/))
        return {error: `Error: ${res.toString()}`}
      })
    })
    var promise = $q.all(promises).then(results => {
      var errors = results.filter(result => result.error)
      return `Imported ${results.length - errors.length} out of ${results.length} assignments (${errors.length} duplicates)`
    })
    NotifyUI.addPromise(promise, 'Importing assignments')
  }

  QualificationType.query({}, (err, document) => {
    if (err) throw err
    $scope.QualificationTypes = [
      ...document.querySelectorAll('QualificationType')
    ].map(QualificationType => nodesToJSON(QualificationType.children))
  })

  $scope.assignQualifications = () => {
    var AssignQualification = $scope.$storage.AssignQualification
    var promises = $scope.assignments.map(assignment => {
      return $turk({
        Operation: 'AssignQualification',
        QualificationTypeId: AssignQualification.QualificationTypeId,
        WorkerId: assignment.WorkerId,
        IntegerValue: AssignQualification.IntegerValue,
        SendNotification: AssignQualification.SendNotification,
      })
    })
    var promise = $q.all(promises).then((results) => {
      return `Sent ${results.length} AssignQualification requests`
    })
    NotifyUI.addPromise(promise)
  }
})
.directive('assignment', function($state, $localStorage, $turk, Response) {
  return {
    restrict: 'A',
    templateUrl: '/ui/admin/mturk/assignment.html',
    scope: {
      assignment: '=',
    },
    link: function(scope) {
      scope.$storage = $localStorage
      var responses = Response.query({aws_worker_id: scope.assignment.WorkerId}, function() {
        var transform_functionBody = $localStorage.responses_summarizer || 'return responses;'
        var transform_function = new Function('responses', 'assignment', transform_functionBody) // eslint-disable-line no-new-func

        var transformed_responses = transform_function(angular.copy(responses), angular.copy(scope.assignment))

        scope.responses = transformed_responses
      })

      scope.blockWorker = function(Reason) {
        var promise = $turk({
          Operation: 'BlockWorker',
          WorkerId: scope.assignment.WorkerId,
          Reason: Reason,
        }).then(function(document) {
          var xml = new XMLSerializer().serializeToString(document)
          console.log('BlockWorker response', xml)
          return xml
        })
        NotifyUI.addPromise(promise)
      }

      scope.setStatus = function(Operation) {
        // Operation should start with one of 'Approve' | 'Reject' | 'ApproveRejected'
        var promise = $turk({
          Operation: Operation,
          AssignmentId: scope.assignment.AssignmentId,
          RequesterFeedback: scope.RequesterFeedback,
        }).then(() => {
          return 'Set status successfully'
        })
        NotifyUI.addPromise(promise)
      }
    },
  }
})
.controller('admin.mturk.dashboard', function($scope, $localStorage, $state, $turk) {
  $scope.NotifyWorkers = function() {
    $turk({
      Operation: 'NotifyWorkers',
      Subject: $scope.notification.Subject,
      MessageText: $scope.notification.MessageText,
      WorkerId: $scope.notification.WorkerId,
    }).then(document => {
      var xml = new XMLSerializer().serializeToString(document)
      console.log(xml)
    })
  }

  $turk({
    Operation: 'GetAccountBalance',
  }).then(document => {
    $scope.AvailableBalance = nodesToJSON(document.querySelector('AvailableBalance').children)
  })
})
.controller('admin.mturk.qualification_types.table', ($scope, $localStorage, $turk, $timeout) => {
  $scope.SearchQualificationTypes = $localStorage.$default({
    SearchQualificationTypes: {
      Operation: 'SearchQualificationTypes',
      SortProperty: 'Name', // default, only option, not required
      SortDirection: 'Ascending',
      PageSize: 10,
      PageNumber: 1,
      MustBeRequestable: false,
      MustBeOwnedByCaller: true,
    },
  }).SearchQualificationTypes

  $scope.refresh = () => {
    var data = $scope.SearchQualificationTypes
    if (data.Query === '') {
      data.Query = null
    }
    QualificationType.query(data, function(err, document) {
      if (err) throw err
      // document is a Document instance.
      $timeout(() => {
        $scope.QualificationTypes = [
          ...document.querySelectorAll('QualificationType'),
        ].map(QualificationType => nodesToJSON(QualificationType.children))
      })
    })
  }

  $scope.refresh()

  $scope.delete = (QualificationType) => {
    var promise = $turk({
      Operation: 'DisposeQualificationType',
      QualificationTypeId: QualificationType.QualificationTypeId,
    }).then(() => {
      $scope.QualificationTypes.splice($scope.QualificationTypes.indexOf(QualificationType), 1)
      return `Deleted QualificationType: ${QualificationType.QualificationTypeId}`
    })
    NotifyUI.addPromise(promise)
  }
})
.controller('admin.mturk.qualification_types.new', function($scope, $http, $state, $location, $localStorage, $turk) {
  $scope.QualificationType = $localStorage.$default({
    QualificationType: {
      RetryDelayInSeconds: '30m',
      QualificationTypeStatus: 'Active',
      AutoGranted: false,
      AutoGrantedValue: 1,
    },
  }).QualificationType

  $scope.sync = function() {
    var data = {
      Operation: 'CreateQualificationType',
      Name: $scope.QualificationType.Name,
      Description: $scope.QualificationType.Description,
      Keywords: $scope.QualificationType.Keywords,
      RetryDelayInSeconds: $scope.QualificationType.RetryDelayInSeconds,
      QualificationTypeStatus: $scope.QualificationType.QualificationTypeStatus,
      Test: $scope.QualificationType.Test,
      TestDuration: $scope.QualificationType.TestDuration,
      AnswerKey: $scope.QualificationType.AnswerKey,
      AutoGranted: $scope.QualificationType.AutoGranted,
      AutoGrantedValue: $scope.QualificationType.AutoGranted ? $scope.QualificationType.AutoGrantedValue : undefined,
    }
    var promise = $turk(data).then(function(res) {
      var QualificationTypeId = res.querySelector('QualificationTypeId').textContent
      return `Created QualificationType: ${QualificationTypeId}`
    })
    NotifyUI.addPromise(promise)
  }
})
.controller('admin.mturk.qualification_types.edit', function($scope, $state, $localStorage, $turk) {
  $scope.$storage = $localStorage.$default({
    AssignQualification: {
      IntegerValue: 1,
      SendNotification: 1,
    },
  })

  QualificationType.get({QualificationTypeId: $state.params.QualificationTypeId}, (err, document) => {
    if (err) throw err
    $scope.QualificationType = nodesToJSON(document.querySelector('QualificationType').children)
  })

  $turk({
    Operation: 'GetQualificationsForQualificationType',
    QualificationTypeId: $state.params.QualificationTypeId,
    // Status: 'Granted' | 'Revoked',
    PageSize: 100,
    PageNumber: 1,
  }).then(function(document) {
    $scope.Qualifications = [
      ...document.querySelectorAll('Qualification'),
    ].map(Qualification => nodesToJSON(Qualification.children))
  })

  $scope.assignQualification = () => {
    $scope.$storage.AssignQualification.QualificationTypeId = $state.params.QualificationTypeId
    QualificationType.assign($scope.$storage.AssignQualification, (err) => {
      if (err) throw err
      NotifyUI.add(`Assigned Qualification Type to ${$scope.$storage.AssignQualification.WorkerId}.`)
    })
  }

  $scope.deleteQualification = (Qualification) => {
    $scope.$storage.AssignQualification.QualificationTypeId = $state.params.QualificationTypeId
    QualificationType.revoke({SubjectId: Qualification.SubjectId, QualificationTypeId: $state.params.QualificationTypeId}, (err) => {
      if (err) throw err
      $scope.Qualifications.splice($scope.Qualifications.indexOf(Qualification), 1)
      NotifyUI.add(`Revoked Qualification Type from ${Qualification.SubjectId}.`)
    })
  }

  $scope.sync = () => {
    // $scope.$storage.AssignQualification.QualificationTypeId = $state.params.QualificationTypeId
    QualificationType.update($scope.QualificationType, (err) => {
      if (err) throw err
      NotifyUI.add('Updated Qualification Type.')
    })
  }
})
