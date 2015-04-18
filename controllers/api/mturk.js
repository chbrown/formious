var _ = require('lodash');
var async = require('async');
var logger = require('loge');
var Router = require('regex-router');
var moment = require('moment');
var turk = require('turk');
var util = require('util');
var url = require('url');

var db = require('../../db');
var models = require('../../models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
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

/** POST /api/mturk/GetAccountBalance
Get the account balance payload for the account & host specified in the querystring */
R.post(/^\/api\/mturk\/GetAccountBalance/, function(req, res) {
  req.turk.GetAccountBalance({}, function(err, result) {
    if (err) return res.die(err);
    // {"GetAccountBalanceResponse":{"OperationRequest":{"RequestId":"9ef506b"},
    // "GetAccountBalanceResult": {"Request":{"IsValid":"True"},"AvailableBalance":
    // {"Amount":"10000.000","CurrencyCode":"USD","FormattedPrice":"$10,000.00"}}}}
    // var available_price = result.GetAccountBalanceResult.AvailableBalance;
    res.json(result);
  });
});

/** POST /api/mturk/ApproveAssignment

POST payload fields:
  AssignmentId: String (required)
  RequesterFeedback: String (optional)

Approve the specified Assignment */
R.post(/^\/api\/mturk\/ApproveAssignment/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var params = {AssignmentId: data.AssignmentId};
    if (data.RequesterFeedback) {
      params.RequesterFeedback = data.RequesterFeedback;
    }
    req.turk.ApproveAssignment(params, function(err, result) {
      if (err) return res.die(err);
      // {message: 'Approved assignment: ' + data.AssignmentId}
      res.status(204).end();
    });
  });
});

/** POST /api/mturk/GrantBonus

POST payload fields:
  WorkerId: String (required)
  AssignmentId: String (required)
  BonusAmount: Number (required)
  Reason: String (optional)

Grant a bonus for the specified Assignment */
R.post(/^\/api\/mturk\/GrantBonus/, function(req, res, m) {
  var AssignmentId = m[1];
  req.readData(function(err, data) {
    if (err) return res.die(err);

    // hardcode the max amount as $5, just in case something goes wrong
    var amount = Math.min(parseFloat(data.BonusAmount), 5.0);

    var WorkerId = data.WorkerId;
    var params = {
      WorkerId: WorkerId,
      AssignmentId: AssignmentId,
      BonusAmount: new turk.models.Price(amount),
      UniqueRequestToken: AssignmentId + ':' + WorkerId + ':bonus',
    };

    if (data.Reason) {
      params.Reason = data.Reason;
    }

    req.turk.GrantBonus(params, function(err, result) {
      if (err) return res.die(err);

      models.Participant.one({aws_worker_id: WorkerId}, function(err, participant) {
        if (err) return res.die(err);

        db.Update('participants')
        .setEqual({
          bonus_owed: participant.bonus_owed - amount,
          bonus_paid: participant.bonus_paid + amount,
        })
        .whereEqual({id: participant.id})
        .execute(function(err, rows) {
          if (err) return res.die(err);

          res.status(204).end();
        });
      });
    });
  });
});

/** GET /api/mturk/hits
List all active HITs */
R.get(/^\/api\/mturk\/hits(\?|$)/, function(req, res) {
  req.turk.SearchHITs({SortDirection: 'Descending', PageSize: 100}, function(err, result) {
    if (err) return res.die(err);

    var hits = result.SearchHITsResult.HIT || [];
    if (!Array.isArray(hits)) hits = [hits];

    res.ngjson(hits);
  });
});

/** POST /api/mturk/hits

POST payload fields:
  Reward: Number (required)
  Keywords: String (required)
  Question: Number (required)
  AssignmentDurationInSeconds: Number (required)
  LifetimeInSeconds: Number (required)
  AutoApprovalDelayInSeconds: Number (required)
  ... others ...

Create a new HIT */
R.post(/^\/api\/mturk\/hits(\?|$)/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var params = {
      MaxAssignments: parseInt(data.MaxAssignments, 10),
      Title: data.Title,
      Description: data.Description,
      Reward: new turk.models.Price(parseFloat(data.Reward)),
      Keywords: data.Keywords,
      Question: new turk.models.ExternalQuestion(data.ExternalURL, parseInt(data.FrameHeight, 10)),
      AssignmentDurationInSeconds: durationStringToSeconds(data.AssignmentDuration || 0),
      LifetimeInSeconds: durationStringToSeconds(data.Lifetime || 0),
      AutoApprovalDelayInSeconds: durationStringToSeconds(data.AutoApprovalDelay || 0),
    };
    var extra = _.omit(data, Object.keys(params));
    _.extend(params, extra);

    logger.debug('CreateHIT data:', params, req.turk.url);
    req.turk.CreateHIT(params, function(err, result) {
      if (err) return res.die(err);
      // result is something like:
      // {
      //   "OperationRequest": {
      //     "RequestId":"1b8ed7eb-dae3-3500-c2ad-73aa4EXAMPLE"
      //   },
      //   "HIT":{
      //     "Request":{"IsValid":"True"},
      //     "HITId":"FB2EF51D88F724F2A124026EXAMPLE",
      //     "HITTypeId":"1BBB6B0FE7967122FD0243AEXAMPLE"
      //   }
      // }
      var url = '/admin/mturk/hits/' + result.HIT.HITId;
      res.status(201).setHeader('Location', url);
      res.json(result);
    });
  });
});

/** POST /api/mturk/hits/:HITId/ExtendHIT
Extend a HIT by the specified increment */
R.post(/^\/api\/mturk\/hits\/(\w+)\/ExtendHIT(\?|$)/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var params = {HITId: data.HITId};
    if (data.MaxAssignmentsIncrement) {
      params.MaxAssignmentsIncrement = parseInt(data.MaxAssignmentsIncrement, 10);
    }
    if (data.ExpirationIncrement) {
      params.ExpirationIncrementInSeconds = durationStringToSeconds(data.ExpirationIncrement || 0);
    }

    logger.debug('ExtendHIT data: %j', params);
    req.turk.ExtendHIT(params, function(err, result) {
      if (err) return res.die(err);
      res.status(204).end();
    });
  });

});

/** GET /api/mturk/hits/:HITId
Show single HIT. */
R.get(/^\/api\/mturk\/hits\/(\w+)(\?|$)/, function(req, res, m) {
  req.turk.GetHIT({HITId:  m[1]}, function(err, result) {
    if (err) return res.die(err);
    res.json(result.HIT);
  });
});

/** GET /api/mturk/hits/:HITId/BonusPayments
Show the bonus payments associated with a single HIT. */
R.get(/^\/api\/mturk\/hits\/(\w+)\/BonusPayments(\?|$)/, function(req, res, m) {
  req.turk.GetBonusPayments({HITId: m[1], PageSize: 100}, function(err, result) {
    if (err) return res.die(err);
    res.ngjson(result.GetBonusPaymentsResult.BonusPayment || []);
  });
});

/** GET /api/mturk/hits/:HITId/Assignments
Show the assignments submitted for a single HIT. */
R.get(/^\/api\/mturk\/hits\/(\w+)\/Assignments(\?|$)/, function(req, res, m) {
  var hit_params = {HITId: m[1], PageSize: 100};
  var assignments_params = _.extend({
    SortProperty: 'SubmitTime',
    SortDirection: 'Ascending',
  }, hit_params);

  // async.auto runs each task as quickly as possible but
  // stops the whole thing if any callback with an error
  req.turk.GetAssignmentsForHIT(assignments_params, function(err, result) {
    if (err) return res.die(err);

    var assignments = result.GetAssignmentsForHITResult.Assignment || [];
    if (!Array.isArray(assignments)) assignments = [assignments];

    var aws_worker_ids = assignments.map(function(assignment) {
      return assignment.WorkerId;
    });

    db.Select('participants')
    // db.Select('participants JOIN responses ON responses.participant_id = participants.id')
    // .add('participants.*', 'MAX(responses.created) - MIN(responses.created) AS duration')
    // .groupBy('participants.id')
    .whereIn('aws_worker_id', aws_worker_ids)
    .execute(function(err, participants) {
      if (err) return res.die(err);

      // merge in the participant info from the local databse query
      async.map(assignments, function(assignment, callback) {
        // hack! (someone broke my xmlconv root namespace ignorance)
        // var answer_xml = assignment.Answer.replace(/xmlns=("|').+?\1/, '');
        xml2js.parseString(assignment.Answer, {explicitArray: false}, function(err, answer_json) {
          if (err) return callback(err);

          var participant = _.findWhere(participants, {aws_worker_id: assignment.WorkerId});

          var answers = _(answer_json.QuestionFormAnswers.Answer).map(function(answer) {
            return [answer.QuestionIdentifier, answer.FreeText];
          }).object().value();

          // SELECT MAX(created), MIN(created),  FROM responses WHERE responses.participant_id = 288;
          db.Select('responses')
          .add('EXTRACT(epoch FROM MAX(created) - MIN(created)) AS duration')
          .whereEqual({participant_id: participant.id})
          .execute(function(err, responses) {
            if (err) return callback(err);

            // console.log(responses[0].duration);

            participant.duration = responses[0].duration.toFixed(0) + ' seconds';

            callback(null, {
              properties: _.omit(assignment, ['Answer']),
              participant: participant,
              answers: answers,
            });
          });
        });
      }, function(err, assignments) {
        if (err) return res.die(err);
        res.ngjson(assignments);
      });
    });
  });
});

/** POST /api/mturk/hits/:HITId/import

Import the assignment data for this HIT into the local database.
*/
R.post(/^\/api\/mturk\/hits\/(\w+)\/import/, function(req, res, m) {
  var HITId = m[1];

  var hit_params = {
    HITId: HITId,
    PageSize: 100,
  };
  req.turk.GetAssignmentsForHIT(hit_params, function(err, result) {
    if (err) return res.die(err);

    var assignments = result.GetAssignmentsForHITResult.Assignment || [];
    if (!Array.isArray(assignments)) assignments = [assignments];
    async.map(assignments, function(assignment, callback) {
      // hack! (someone broke my xmlconv root namespace ignorance)

      var response = {
        value: _.pick(assignment, 'HITId', 'AutoApprovalTime', 'AcceptTime', 'SubmitTime', 'ApprovalTime'),
        assignment_id: assignment.AssignmentId,
      };

      // pick off the answers
      var answer_xml = assignment.Answer.replace(/xmlns=("|').+?\1/, '');
      var answer_json = xmlconv(answer_xml, {convention: 'castle'});
      answer_json.QuestionFormAnswers.Answer.forEach(function(answer) {
        // TODO: handle other types of values besides FreeText
        if (answer.QuestionIdentifier == 'stim_id') {
          // stim_id isn't required, but if it's provided, it had better be an actual stim!
          response.stim_id = answer.FreeText;
        }
        else {
          response.value[answer.QuestionIdentifier] = answer.FreeText;
        }
      });

      models.Participant.addResponse({aws_worker_id: assignment.WorkerId}, response, function(err) {
        if (err) {
          if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
            return callback(null, 0);
          }
          return callback(err);
        }
        callback(null, 1);
      });
    }, function(err, assignments) {
      if (err) return res.die(err);

      var total = assignments.length;
      var added = assignments.filter(_.identity).length;
      var message = util.format('Imported %d out of %d assignments (%d duplicates)',
        added, total, total - added);
      res.json({message: message});
    });
  });

});

/* GET /admin/aws/:account_id/host/:host/HITs/:hit_id.csv
    GET /admin/aws/:account_id/host/:host/HITs/:hit_id.csv?view
    GET /admin/aws/:account_id/host/:host/HITs/:hit_id.tsv
    GET /admin/aws/:account_id/host/:host/HITs/:hit_id.tsv?view
Download or view HIT csv/tsv summary of users responses */
/* R.get(/HITs\/(\w+)\.(csv|tsv)/, function(req, res, m) {
  // instead of ?: conditionals, we have a limited input (csv/tsv) so we set up some constant mappings:
  var content_types = {csv: 'text/csv', tsv: 'text/tab-separated-values'};
  var delimiters = {csv: ',', tsv: '\t'};

  var urlObj = url.parse(req.url, true);
  // both ?view= and ?view parse to '' (only complete absence is undefined)
  logger.debug('HITs/download: ?view="%s"', urlObj.query.view);
  if (urlObj.query.view === undefined) {
    res.setHeader('Content-Disposition', 'attachment; filename=HIT_' + m[1] + '.' + m[2]);
    res.setHeader('Content-Type', content_types[m[2]]);
  }
  else {
    res.setHeader('Content-Type', 'text/plain');
  }

  var writer = new sv.Stringifier({delimiter: delimiters[m[2]]});
  writer.pipe(res);

  var params = {HITId: m[1], PageSize: 100, SortProperty: 'SubmitTime', SortDirection: 'Ascending'};
  req.turk.GetAssignmentsForHIT(params, function(err, assignments_result) {
    if (err) return writer.emit('error', err).end();

    var raw_assigments = assignments_result.GetAssignmentsForHITResult.Assignment;
    async.eachSeries(raw_assigments, function(assignment, callback) {
      var assignment_answers = {};
      // pull in the Assignment level POST that AMT stores:
      var answer = xmlconv(assignment.Answer, {convention: 'castle'});
      answer.Answer.forEach(function(question_answer) {
        assignment_answers[question_answer.QuestionIdentifier] = question_answer.FreeText;
      });
      // For each response recorded for this user, merge in those assignment details and write to csv
      models.User.findById(assignment.WorkerId, function(err, user) {
        if (err) return callback(err);

        var responses = (user ? user.responses : null) || [];
        responses.forEach(function(response) {
          _.extend(response, assignment_answers);
          writer.write(response);
        });
        callback(null);
      });
    }, function(err) {
      if (err) {
        logger.error('Error encountered when iterating assignments from MTurk API: ', err);
        writer.emit('error', err);
      }

      writer.end();
    });
  });
});*/

/** ANY /api/mturk/*

All requests to /api/mturk are expected to provide the aws_account_id and host name
in the request querystring. */
module.exports = function(req, res) {
  var urlObj = url.parse(req.url, true);
  // aws_account_id is provided by the user, and linked to an AWS Access Key and AWS Secret Key
  var aws_account_id = urlObj.query.aws_account_id || null;
  // host is either "deploy" or "sandbox", usually.
  var host = urlObj.query.host || null;

  // that host value is just a short key for one of the following urls
  var hosts = {
    deploy: 'https://mechanicalturk.amazonaws.com',
    sandbox: 'https://mechanicalturk.sandbox.amazonaws.com',
    local: '/',
  };

  models.AWSAccount.one({id: aws_account_id}, function(err, aws_account) {
    if (err) return res.die(err);

    req.turk = new turk.Connection(
      aws_account.access_key_id,
      aws_account.secret_access_key, {
      url: hosts[host],
      logger: logger,
    });

    R.route(req, res);
  });
};
