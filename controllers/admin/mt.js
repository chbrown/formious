'use strict'; /*jslint node: true, es5: true, indent: 2 */
var querystring = require('querystring');
var mechturk = require('mechturk');
var moment = require('moment');
var _ = require('underscore');
var sv = require('sv');
var amulet = require('amulet');
var async = require('async');
var models = require('../../models');
var logger = require('../../logger');
var Router = require('regex-router');
var R = new Router();

var durationStringToSeconds = function(s) {
  // takes a string like "5h" and returns 5*60*60, the number of seconds in five hours
  var matches = s.match(/\d+\w/g);
  var duration = moment.duration(0);
  matches.forEach(function(match) {
    var parts = match.match(/(\d+)(\w)/);
    duration.add(parseInt(parts[1], 10), parts[2]);
  });
  return duration.asSeconds();
};

var hosts = {
  deploy: 'https://mechanicalturk.amazonaws.com',
  sandbox: 'https://mechanicalturk.sandbox.amazonaws.com',
  local: '/',
};

// /admin/mt
module.exports = function(m, req, res) {
  // /admin/mt/(account_name)/(host_name)
  var account_id = m[1];
  var host_id = m[2];

  // assert req.user && req.user.superuser
  models.AWSAccount.findById(account_id, function(err, account) {
    logger.maybe(err);
    req.turk = mechturk({
      url: '' + hosts[host_id],
      accessKeyId: account.accessKeyId,
      secretAccessKey: account.secretAccessKey,
      logger: logger
    });
    R.route(req, res);
  });
};

R.default = function(m, req, res) {
  res.die('No route');
};

R.post(/GetAccountBalance/, function(m, req, res) {
  req.turk.GetAccountBalance({}, function(err, result) {
    logger.maybe(err);
    // {"GetAccountBalanceResponse":{"OperationRequest":{"RequestId":"9ef506b"},
    // "GetAccountBalanceResult": {"Request":{"IsValid":"True"},"AvailableBalance":
    // {"Amount":"10000.000","CurrencyCode":"USD","FormattedPrice":"$10,000.00"}}}}
    // var available_price = result.GetAccountBalanceResult.AvailableBalance;
    res.json(result || 'error');
  });
});

R.post(/CreateHIT/, function(m, req, res) {
  req.readToEnd('utf8', function(err, data) {
    logger.maybe(err);
    var fields = querystring.parse(data);
    var params = {
      MaxAssignments: parseInt(fields.MaxAssignments, 10),
      Title: fields.Title,
      Description: fields.Description,
      Reward: new mechturk.models.Price(parseFloat(fields.Reward)),
      Keywords: fields.Keywords,
      Question: new mechturk.models.ExternalQuestion(fields.ExternalURL, parseInt(fields.FrameHeight, 10)),
      AssignmentDurationInSeconds: durationStringToSeconds(fields.AssignmentDuration || 0),
      LifetimeInSeconds: durationStringToSeconds(fields.Lifetime || 0),
      AutoApprovalDelayInSeconds: durationStringToSeconds(fields.AutoApprovalDelay || 0),
    };
    req.turk.CreateHIT(params, function(err, result) {
      logger.maybe(err);
      res.json(result || 'error');
    });
  });
});

R.get(/Workers\/(\w+)/, function(m, req, res) {
  models.User.findById(m[1], function(err, user) {
    logger.maybe(err);
    res.json(user);
  });
});

R.post(/Assignments\/(\w+)\/Approve/, function(m, req, res) {
  var AssignmentId = m[1];
  req.readToEnd('utf8', function(err, data) {
    logger.maybe(err);
    var fields = querystring.parse(data);
    var params = {AssignmentId: AssignmentId};
    if (fields.RequesterFeedback) params.RequesterFeedback = fields.RequesterFeedback;
    req.turk.ApproveAssignment(params, function(err, result) {
      logger.maybe(err);
      if (err) {
        res.json({success: false, message: err.toString()});
      }
      else {
        res.json({success: true, message: 'Approved Assignment: ' + AssignmentId});
      }
    });
  });
});

R.post(/Assignments\/(\w+)\/GrantBonus/, function(m, req, res) {
  var AssignmentId = m[1];
  req.readToEnd('utf8', function(err, data) {
    logger.maybe(err);
    var fields = querystring.parse(data);
    var UniqueRequestToken = AssignmentId + ':' + fields.WorkerId + ':bonus';
    var amount = Math.min(parseFloat(fields.BonusAmount), 5);
    var WorkerId = fields.WorkerId;
    var params = {
      WorkerId: WorkerId,
      AssignmentId: AssignmentId,
      BonusAmount: new mechturk.models.Price(amount),
      UniqueRequestToken: UniqueRequestToken
    };

    if (fields.Reason) params.Reason = fields.Reason;

    req.turk.GrantBonus(params, function(err, result) {
      logger.maybe(err);
      if (err) {
        res.json({success: false, message: err.toString()});
      }
      else {
        models.User.findById(WorkerId, function(err, user) {
          if (err) {
            logger.error(err);
            res.json({success: false, message: err.toString()});
          }
          else {
            user.bonus_owed -= amount;
            user.bonus_paid += amount;
            user.save(function(err) {
              if (err) {
                res.json({success: false, message: err.toString()});
              }
              else {
                var message = 'Granted bonus to user: ' + WorkerId;
                res.json({success: true, message: message});
              }
            });
          }
        });
      }
    });
  });
});

// HIT/show tsv
R.get(/HITs\/(\w+)\.(c|t)sv/, function(m, req, res) {
  var HITId = m[1];
  var delimiter = m[2] == 'c' ? ',' : '\t';
  // should really peek to learn the columns
  // var columns = ['workerId', 'duration'].concat(['choice', 'correct', 'truth',
  //   'image_id', 'prior', 'judgments', 'reliabilities', 'batch_index', 'scene_index',
  //   'submitted', 'task_started', 'time', 'width', 'workerId', 'version']);
  // res.setHeader('Content-Type', delimiter == ',' ? 'text/csv' : 'text/tab-separated-values');
  var writer = sv.Stringifier({delimiter: delimiter});
  writer.pipe(res);
  var params = {HITId: HITId, PageSize: 100, SortProperty: 'SubmitTime', SortDirection: 'Ascending'};
  req.turk.GetAssignmentsForHIT(params, function(err, assignments_result) {
    logger.maybe(err);
    var raw_assigments = assignments_result.GetAssignmentsForHITResult.Assignment;
    // for each assignment
    async.eachSeries(raw_assigments, function fillAssignment(assignment, callback) {
      var assignment_answers = {};
      // pull in the Assignment level POST that AMT stores:
      mechturk.xml2json(assignment.Answer).QuestionFormAnswers.Answer.forEach(function(question_answer) {
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
      logger.maybe(err);
      writer.end();
    });
  });
});

// GET /admin/mt/:account/:host/HITs/new -> form to create new HIT
R.get(/HITs\/new/, function(m, req, res) {
  amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/HITs/new.mu']).pipe(res);
});

// HITs/show
R.get(/HITs\/(\w+)/, function(m, req, res) {
  var HITId = m[1];
  var ctx = {};
  var params = {HITId: HITId, PageSize: 100};
  var sort_params = {SortProperty: 'SubmitTime', SortDirection: 'Ascending'};
  req.turk.GetHIT({HITId:  HITId}, function(err, result) {
    ctx.hit = result.HIT;
    req.turk.GetAssignmentsForHIT(_.extend({}, params, sort_params), function(err, result) {
      logger.maybe(err);
      var raw_assigments = result.GetAssignmentsForHITResult.Assignment || [];
      req.turk.GetBonusPayments(params, function(err, result) {
        ctx.BonusPayments = result.GetBonusPaymentsResult.BonusPayment;

        async.map(raw_assigments, function fillAssignment(assignment, callback) {
          assignment.Answer = mechturk.xml2json(assignment.Answer).QuestionFormAnswers.Answer;

          models.User.findById(assignment.WorkerId, function(err, user) {
            logger.maybe(err);

            var user_hash = {error: 'Could not find user'};
            if (user) {
              user_hash = user.toJSON();
              user_hash.responses_length = user_hash.responses.length;
              delete user_hash.responses;
              delete user_hash.__v;
              assignment.bonus_owed = user.get('bonus_owed');
            }
            assignment.user_fields = _.map(user_hash, function(value, key) {
              return {key: key, value: value};
            });

            callback(null, assignment);
          });
        }, function(err, assignments) {
          logger.maybe(err);
          ctx.assignments = assignments;
          amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/HITs/one.mu'], ctx).pipe(res);
        });
      });
    });
  });
});

// HITs/index
R.get(/HITs/, function(m, req, res) {
  req.turk.SearchHITs({SortDirection: 'Descending', PageSize: 100}, function(err, result) {
    logger.maybe(err);
    var ctx = {hits: result.SearchHITsResult.HIT};
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/HITs/all.mu'], ctx).pipe(res);
  });
});

