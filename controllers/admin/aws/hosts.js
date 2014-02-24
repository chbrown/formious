/*jslint node: true */
var querystring = require('querystring');
var _ = require('underscore');
var sv = require('sv');
var amulet = require('amulet');
var async = require('async');
var turk = require('turk');
var Router = require('regex-router');
var xmlconv = require('xmlconv');
var url = require('url');

var logger = require('loge');
var misc = require('../../../lib');
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
`req.turk`, which is an instance of turk.Connection.
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
      Reward: new turk.models.Price(parseFloat(fields.Reward)),
      Keywords: fields.Keywords,
      Question: new turk.models.ExternalQuestion(fields.ExternalURL, parseInt(fields.FrameHeight, 10)),
      AssignmentDurationInSeconds: misc.durationStringToSeconds(fields.AssignmentDuration || 0),
      LifetimeInSeconds: misc.durationStringToSeconds(fields.Lifetime || 0),
      AutoApprovalDelayInSeconds: misc.durationStringToSeconds(fields.AutoApprovalDelay || 0),
    };

    logger.debug('CreateHIT params:', params);
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
      if (err) return res.die('ApproveAssignment failed: ' + err);

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
      BonusAmount: new turk.models.Price(amount),
      UniqueRequestToken: AssignmentId + ':' + WorkerId + ':bonus',
    };

    if (fields.Reason) params.Reason = fields.Reason;

    req.turk.GrantBonus(params, function(err, result) {
      if (err) return res.die('GrantBonus failed: ' + err);

      models.User.findById(WorkerId, function(err, user) {
        if (err) return res.die('User.findById failed: ' + err);
        if (!user) return res.die('User could not be found: ' + WorkerId);

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

/** GET /admin/aws/:account_id/host/:host/HITs/:hit_id.csv
    GET /admin/aws/:account_id/host/:host/HITs/:hit_id.csv?view
    GET /admin/aws/:account_id/host/:host/HITs/:hit_id.tsv
    GET /admin/aws/:account_id/host/:host/HITs/:hit_id.tsv?view
Download or view HIT csv/tsv summary of users responses */
R.get(/HITs\/(\w+)\.(csv|tsv)/, function(req, res, m) {
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

      // should this call end even if we hit an error?
      writer.end();
    });
  });
});

// GET /admin/aws/:account/:hosts/HITs/new -> form to create new HIT
R.get(/HITs\/new/, function(req, res, m) {
  amulet.stream(['admin/layout.mu', 'admin/HITs/new.mu'], req.ctx).pipe(res);
});

// HITs/show
R.get(/HITs\/(\w+)/, function(req, res, m) {
  var HITId = m[1];
  var params = {HITId: HITId, PageSize: 100};
  var sort_params = {SortProperty: 'SubmitTime', SortDirection: 'Ascending'};

  // async.auto runs each task as quickly as possible but stops the whole thing if any callback with an error
  async.auto({
    GetHIT: function(callback) {
      req.turk.GetHIT({HITId:  HITId}, callback);
    },
    GetAssignmentsForHIT: function(callback) {
      var payload = _.extend({}, params, sort_params);
      req.turk.GetAssignmentsForHIT(payload, callback);
    },
    GetBonusPayments: function(callback) {
      req.turk.GetBonusPayments(params, callback);
    },
  }, function(err, results) {
    if (err) return res.die('GetHIT / GetAssignmentsForHIT / GetBonusPayments error: ' + err);

    var hit_assignments_result = results.GetAssignmentsForHIT.GetAssignmentsForHITResult;
    var raw_assigments = hit_assignments_result.Assignment || [];
    async.map(raw_assigments, function(assignment, callback) {
      // logger.warn('assignment.Answer', assignment.Answer);
      var answer_json = xmlconv(assignment.Answer, {convention: 'castle'});
      // logger.warn('answer_json', answer_json);
      assignment.Answer = answer_json.Answer;

      models.User.findById(assignment.WorkerId, function(err, user) {
        if (err) return callback(err);

        if (user) {
          user = _.omit(user.toJSON(), 'response', '__v');
        }
        else {
          user = {};
          logger.info('Could not find user: ', assignment.WorkerId);
        }

        // reduce to key-value pairs so that we can show in both Mu/Handlebars easily
        assignment.user = _.map(user, function(value, key) {
          return {key: key, value: value};
        });

        // assignment.bonus_owed = user.get('bonus_owed');
        callback(null, assignment);
      });
    }, function(err, assignments) {
      if (err) return res.die('Assignment mapping error: ' + err);

      var bonus_payments = results.GetBonusPayments;

      _.extend(req.ctx, {
        hit: results.GetHIT.HIT,
        BonusPayments: bonus_payments.GetBonusPaymentsResult.BonusPayment,
        assignments: assignments,
      });
      amulet.stream(['admin/layout.mu', 'admin/HITs/one.mu'], req.ctx).pipe(res);
    });
  });
});

// index: list all HITs
R.get(/HITs$/, function(req, res) {
  req.turk.SearchHITs({SortDirection: 'Descending', PageSize: 100}, function(err, result) {
    if (err) return res.die('SearchHITs error: ' + err);

    req.ctx.hits = result.SearchHITsResult.HIT || [];
    amulet.stream(['admin/layout.mu', 'admin/HITs/all.mu'], req.ctx).pipe(res);
  });
});

// /admin/aws/:account_id/hosts/:host
module.exports = function(req, res, m) {
  // m is actually already set correctly; we just want to make sure
  m = req.url.match(/^\/admin\/aws\/([^\/]+)\/hosts\/([^\/]+)/);
  var account_id = m[1];
  var host_id = m[2];

  models.AWSAccount.findById(account_id, function(err, account) {
    if (err) return res.die('AWSAccount.findById error: ' + err);
    if (!account) return res.die('No AWSAccount found: ' + account_id);

    req.turk = new turk.Connection(account.accessKeyId, account.secretAccessKey, {
      url: hosts[host_id],
      logger: logger,
    });

    R.route(req, res);
  });
};
