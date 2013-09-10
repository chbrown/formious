'use strict'; /*jslint node: true, es5: true, indent: 2 */
var querystring = require('querystring');
var _ = require('underscore');
var sv = require('sv');
var amulet = require('amulet');
var async = require('async');
var mechturk = require('mechturk');
var Router = require('regex-router');

var logger = require('../../../lib/logger');
var misc = require('../../../lib/misc');
var models = require('../../../lib/models');

var hosts = {
  deploy: 'https://mechanicalturk.amazonaws.com',
  sandbox: 'https://mechanicalturk.sandbox.amazonaws.com',
  local: '/',
};

/** MT account API-type actions only (aws/index.js handles account credentials)

Overall /admin/aws/ API access url structure:

/admin/aws/(account_name)/hosts/(host_name)/*
    `account_name` is provided by the user, and linked to an AWS Access Key and AWS Secret Key
    `host_name` is either "deploy" or "sandbox".
    `*` is the actual route (optional)

Compared to aws/index.js, all actions under these routes are assured the existence of
`req.turk`, which is an instance of mechturk({...}).
*/

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

R.post(/GetAccountBalance/, function(req, res) {
  req.turk.GetAccountBalance({}, function(err, result) {
    if (err) return res.json({success: false, message: err});
    // {"GetAccountBalanceResponse":{"OperationRequest":{"RequestId":"9ef506b"},
    // "GetAccountBalanceResult": {"Request":{"IsValid":"True"},"AvailableBalance":
    // {"Amount":"10000.000","CurrencyCode":"USD","FormattedPrice":"$10,000.00"}}}}
    // var available_price = result.GetAccountBalanceResult.AvailableBalance;
    res.json(result);
  });
});

R.post(/CreateHIT/, function(req, res) {
  req.readToEnd('utf8', function(err, data) {
    if (err) return res.json({success: false, message: err});

    var fields = querystring.parse(data);
    var params = {
      MaxAssignments: parseInt(fields.MaxAssignments, 10),
      Title: fields.Title,
      Description: fields.Description,
      Reward: new mechturk.models.Price(parseFloat(fields.Reward)),
      Keywords: fields.Keywords,
      Question: new mechturk.models.ExternalQuestion(fields.ExternalURL, parseInt(fields.FrameHeight, 10)),
      AssignmentDurationInSeconds: misc.durationStringToSeconds(fields.AssignmentDuration || 0),
      LifetimeInSeconds: misc.durationStringToSeconds(fields.Lifetime || 0),
      AutoApprovalDelayInSeconds: misc.durationStringToSeconds(fields.AutoApprovalDelay || 0),
    };
    req.turk.CreateHIT(params, function(err, result) {
      if (err) return res.json({success: false, message: err});

      res.json(result);
    });
  });
});

R.get(/Workers\/(\w+)/, function(req, res, m) {
  models.User.findById(m[1], function(err, user) {
    if (err) return res.json({success: false, message: err});

    res.json(user);
  });
});

R.post(/Assignments\/(\w+)\/Approve/, function(req, res, m) {
  var AssignmentId = m[1];
  req.readToEnd('utf8', function(err, data) {
    if (err) return res.json({success: false, message: err});

    var fields = querystring.parse(data);
    var params = {AssignmentId: AssignmentId};
    if (fields.RequesterFeedback) params.RequesterFeedback = fields.RequesterFeedback;
    req.turk.ApproveAssignment(params, function(err, result) {
      if (err) return res.json({success: false, message: err});

      res.json({success: true, message: 'Approved Assignment: ' + AssignmentId});
    });
  });
});

R.post(/Assignments\/(\w+)\/GrantBonus/, function(req, res, m) {
  var AssignmentId = m[1];
  req.readToEnd('utf8', function(err, data) {
    if (err) return res.json({success: false, message: err});

    var fields = querystring.parse(data);
    // set the max amount to be $5, just in case something goes wrong
    var amount = Math.min(parseFloat(fields.BonusAmount), 5);

    var WorkerId = fields.WorkerId;
    var params = {
      WorkerId: WorkerId,
      AssignmentId: AssignmentId,
      BonusAmount: new mechturk.models.Price(amount),
      UniqueRequestToken: AssignmentId + ':' + WorkerId + ':bonus',
    };

    if (fields.Reason) params.Reason = fields.Reason;

    req.turk.GrantBonus(params, function(err, result) {
      if (err) return res.json({success: false, message: err});

      models.User.findById(WorkerId, function(err, user) {
        if (err) return res.json({success: false, message: err});

        user.bonus_owed -= amount;
        user.bonus_paid += amount;
        user.save(function(err) {
          if (err) return res.json({success: false, message: err});

          res.json({success: true, message: 'Granted bonus to user: ' + WorkerId});
        });
      });
    });
  });
});

// HIT/show tsv
R.get(/HITs\/(\w+)\.(csv|tsv)/, function(req, res, m) {
  var HITId = m[1];
  // var columns = ['workerId', 'duration'].concat(['choice', 'correct', 'truth',
  //   'image_id', 'prior', 'judgments', 'reliabilities', 'batch_index', 'scene_index',
  //   'submitted', 'task_started', 'time', 'width', 'workerId', 'version']);
  // res.setHeader('Content-Type', delimiter == ',' ? 'text/csv' : 'text/tab-separated-values');
  var writer = sv.Stringifier({delimiter: m[2] == 'csv' ? ',' : '\t'});
  writer.pipe(res);
  var params = {HITId: HITId, PageSize: 100, SortProperty: 'SubmitTime', SortDirection: 'Ascending'};
  req.turk.GetAssignmentsForHIT(params, function(err, assignments_result) {
    if (err) return writer.emit('error', err).end();

    var raw_assigments = assignments_result.GetAssignmentsForHITResult.Assignment;
    async.eachSeries(raw_assigments, function(assignment, callback) {
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
      if (err) logger.error('Error encountered when iterating assignments from MTurk API', err);

      writer.end();
    });
  });
});

// GET /admin/aws/:account/:hosts/HITs/new -> form to create new HIT
R.get(/HITs\/new/, function(req, res, m) {
  amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/HITs/new.mu']).pipe(res);
});

// HITs/show
R.get(/HITs\/(\w+)/, function(req, res, m) {
  var HITId = m[1];
  var params = {HITId: HITId, PageSize: 100};
  var sort_params = {SortProperty: 'SubmitTime', SortDirection: 'Ascending'};

  async.auto({
    GetHIT: function(callback, results) {
      req.turk.GetHIT({HITId:  HITId}, callback);
    },
    GetAssignmentsForHIT: function(callback, results) {
      var payload = _.extend({}, params, sort_params);
      req.turk.GetAssignmentsForHIT(payload, callback);
    },
    GetBonusPayments: function(callback, results) {
      req.turk.GetBonusPayments(params, callback);
    },
  }, function(err, results) {
    if (err) return res.die('GetHIT|GetAssignmentsForHIT|GetBonusPayments error: ' + err);

    var raw_assigments = results.GetAssignmentsForHITResult.Assignment || [];
    async.map(raw_assigments, function(assignment, callback) {
      console.log('>> async.map assignment', assignment);

      assignment.Answer = mechturk.xml2json(assignment.Answer).QuestionFormAnswers.Answer;

      models.User.findById(assignment.WorkerId, function(err, user) {
        if (err) return callback(err);
        if (!user) return callback(new Error('Could not find user: ' + assignment.WorkerId));

        var user_json = _.chain(user.toJSON()).omit('response', '__v').map(function(value, key) {
          return {key: key, value: value};
        }).value();

        _.extend(assignment, {
          // bonus_owed: user.get('bonus_owed'),
          user: user_json,
        });
        callback(null, assignment);
      });
    }, function(err, assignments) {
      if (err) return res.die('Assignment mapping error: ' + err);

      var ctx = {
        hit: results.GetHIT.HIT,
        BonusPayments: results.GetBonusPaymentsResult.BonusPayment,
        assignments: assignments,
      };
      amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/HITs/one.mu'], ctx).pipe(res);
    });
  });
});

// index: list all HITs
R.get(/HITs$/, function(req, res) {
  req.turk.SearchHITs({SortDirection: 'Descending', PageSize: 100}, function(err, result) {
    if (err) return res.die('SearchHITs error: ' + err);

    var hits = result.SearchHITsResult.HIT || [];
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/HITs/all.mu'], {hits: hits}).pipe(res);
  });
});

// /admin/aws/:account/hosts/:host
module.exports = function(req, res, m) {
  // m is actually already set correctly; we just want to make sure
  m = req.url.match(/^\/admin\/aws\/([^\/]+)\/hosts\/([^\/]+)/);
  var account_name = m[1];
  var host_id = m[2];

  models.AWSAccount.findOne({name: account_name}, function(err, account) {
    if (err) return res.die('AWSAccount.find error: ' + err);
    if (!account) return res.die('No AWSAccount found with that name: ' + account_name);

    req.turk = mechturk({
      url: hosts[host_id],
      accessKeyId: account.accessKeyId,
      secretAccessKey: account.secretAccessKey,
      logger: logger
    });
    R.route(req, res);
  });
};
