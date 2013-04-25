'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var csv = require('csv');
var mechturk_params = require('./mechturk-params');
var mechturk = require('mechturk');
var logger = require('./logger');
var amulet = require('amulet');
var async = require('async');
var formidable = require('formidable');
var __ = require('underscore');
var moment = require('moment');
var util = require('./util');
var Router = require('regex-router');
var models = require('./models');
var User = models.User;

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

var R = new Router();

// R.post(/^\/accounts\/(\w+)\/(\w+)\/(\w+)/, function(m, req, res) {
  // e.g., m[3] == CreateHit
R.post(/CreateHIT/, function(m, req, res) {
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    console.dir(fields);
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
    req.turk_client.CreateHIT(params, function(err, result) {
      logger.maybe(err);
      res.json(result || 'error');
    });
  });
});

R.get(/Workers\/(\w+)/, function(m, req, res) {
  User.findById(m[1], function(err, user) {
    logger.maybe(err);
    // console.log('user', user);
    // if (!user) {
    // user = new User({_id: context.workerId});
    // user.save(logger.maybe);
    // }
    res.json(user);
  });
});

R.post(/Assignments\/(\w+)\/Approve/, function(m, req, res) {
  var AssignmentId = m[1];
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    var params = {AssignmentId: AssignmentId};
    if (fields.RequesterFeedback) params.RequesterFeedback = fields.RequesterFeedback;
    req.turk_client.ApproveAssignment(params, function(err, result) {
      if (err) {
        logger.error(err);
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
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
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

    console.log("params");
    console.dir(params);
    req.turk_client.GrantBonus(params, function(err, result) {
      if (err) {
        logger.error(err);
        res.json({success: false, message: err.toString()});
      }
      else {
        User.findById(WorkerId, function(err, user) {
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

R.get(/HITs\/(\w+)\.(c|t)sv/, function(m, req, res) {
  var HITId = m[1];
  var delimiter = m[2] == 'c' ? ',' : '\t';
  // should really peek to learn the columns
  var columns = ['workerId', 'duration'].concat(['choice', 'correct', 'gold', 'image_id', 'prior', 'judgments', 'reliabilities', 'scene_index', 'submitted', 'task_started', 'time', 'width', 'workerId']);
  var csv_writer = csv().to.stream(res, {delimiter: delimiter, header: true, columns: columns});
  var params = {HITId: HITId, PageSize: 100, SortProperty: 'SubmitTime', SortDirection: 'Ascending'};
  req.turk_client.GetAssignmentsForHIT(params, function(err, assignments_result) {
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
      User.findById(assignment.WorkerId, function(err, user) {
        if (err) return callback(err);
        var responses = (user ? user.responses : null) || [];
        responses.forEach(function(response) {
          __.extend(response, assignment_answers);
          csv_writer.write(response);
        });
        callback(null);
      });
    }, function(err) {
      logger.maybe(err);
      csv_writer.end();
    });
  });
});

R.get(/HITs\/(\w+)/, function(m, req, res) {
  var HITId = m[1];
  var ctx = {HITId: HITId};
  var params = {HITId: HITId, PageSize: 100};
  var sort_params = {SortProperty: 'SubmitTime', SortDirection: 'Ascending'};
  req.turk_client.GetAssignmentsForHIT(__.extend({}, params, sort_params), function(err, result) {
    logger.maybe(err);
    var raw_assigments = result.GetAssignmentsForHITResult.Assignment || [];
    req.turk_client.GetBonusPayments(params, function(err, result) {
      ctx.BonusPayments = result.GetBonusPaymentsResult.BonusPayment;

      async.map(raw_assigments, function fillAssignment(assignment, callback) {
        assignment.Answer = mechturk.xml2json(assignment.Answer).QuestionFormAnswers.Answer;

        User.findById(assignment.WorkerId, function(err, user) {
          logger.maybe(err);

          var user_hash = {error: 'Could not find user'};
          if (user) {
            user_hash = user.toObject();
            user_hash.responses_length = user_hash.responses.length;
            delete user_hash.responses;
            // __.extend(assignment, user_hash);
            assignment.bonus_owed = user.get('bonus_owed');
          }
          assignment.user_fields = __.map(user_hash, function(value, key) {
            return {key: key, value: value};
          });

          callback(null, assignment);
        });
      }, function(err, assignments) {
        logger.maybe(err);
        ctx.assignments = assignments;
        amulet.render(res, ['layout.mu', 'admin/hit.mu'], ctx);
      });
    });
  });
});

R.get(/HITs/, function(m, req, res) {
  req.turk_client.SearchHITs({SortDirection: 'Descending', PageSize: 100}, function(err, result) {
    logger.maybe(err);
    var ctx = {hits: result.SearchHITsResult.HIT};
    // {"GetAccountBalanceResponse":{"OperationRequest":{"RequestId":"9ef506b"},
    // "GetAccountBalanceResult": {"Request":{"IsValid":"True"},"AvailableBalance":
    // {"Amount":"10000.000","CurrencyCode":"USD","FormattedPrice":"$10,000.00"}}}}
    // console.log('result', result);
    // ctx.available_price = result.GetAccountBalanceResult.AvailableBalance;
    amulet.render(res, ['layout.mu', 'admin/hits.mu'], ctx);
  });
});

R.get(/\/responses.tsv/, function(m, req, res) {
  var writeRow = function(out, cells) {
    out.write(cells.join('\t'));
    out.write('\n');
  };

  res.writeHead(200, {'Content-Type': 'text/plain'});

  var user_stream = User.find({responses: {$ne: []}}).sort('-created').stream();
  var headers = [
    'workerId',
    'task_started',
    'prior',
    'scene_index',
    'reliability1',
    'reliability2',
    'reliability3',
    'reliability4',
    'reliability5',
    'judgment1',
    'judgment2',
    'judgment3',
    'judgment4',
    'judgment5',
    'gold',
    'image_id',
    'width',
    'correct',
    'time',
    'submitted'
  ];
  writeRow(res, headers);

  user_stream.on('data', function (user) {
    user.responses.filter(function(r) {
      // test_user_ids.indexOf(r.workerId) === -1 &&
      return r.workerId && r.workerId.match(/^A/);
    }).forEach(function(r) {
      var submit = r.submitted ? r.submitted.toISOString().replace(/\..+$/, '') : '';
      var cells = [].concat(
        r.workerId,
        r.task_started,
        r.prior,
        r.scene_index,
        r.reliabilities, // array
        r.judgments, // array
        r.gold,
        r.image_id,
        r.width,
        r.correct,
        r.time,
        submit
      );
      writeRow(res, cells);
    });
  });
  user_stream.on('error', logger.maybe);
  user_stream.on('close', function () {
    res.end();
  });
});

R.get(/\/responses\/(\d+)\.json/, function(m, req, res) {
  var page = parseInt(m[1], 10);
  var per_page = 10;
  User.find({responses: {$ne: []}}).skip(page*per_page).limit(per_page).sort('-created').exec(function(err, users) {
    var responses = [];
    users.forEach(function(user) {
      util.extend(responses, user.responses);
    });
    res.json(responses);
  });
});


R.get(/dashboard/, function(m, req, res) {
  // /accounts/[account]/[host]
  m = req.url.match(/^\/accounts\/(\w+)\/(\w+)/);
  var ctx = {
    accounts: mechturk_params.accounts,
    account_id: m[1],
    aws_hosts: mechturk_params.hosts,
    aws_host_id: m[2],
  };

  req.turk_client.GetAccountBalance({}, function(err, result) {
    logger.maybe(err);
    // {"GetAccountBalanceResponse":{"OperationRequest":{"RequestId":"9ef506b"},
    // "GetAccountBalanceResult": {"Request":{"IsValid":"True"},"AvailableBalance":
    // {"Amount":"10000.000","CurrencyCode":"USD","FormattedPrice":"$10,000.00"}}}}
    ctx.available_price = result.GetAccountBalanceResult.AvailableBalance;
    amulet.render(res, ['layout.mu', 'admin/default.mu'], ctx);
  });
});


R.default = function(m, req, res) {
  // /accounts/[account]/[host]
  m = req.url.match(/^\/accounts\/(\w+)\/(\w+)/);
  res.redirect('/accounts/' + m[1] + '/' + m[2] + '/dashboard');
};

module.exports = function(universalR) {
  // /accounts/{account_id}/{host_id}
  universalR.any(/^\/accounts\/(\w+)\/(\w+)/, function(m, req, res) {
    // document.cookie = 'wepEdYrVaigs=true;path=/';
    var cookie_name = process.env.MT_PASSWORD || 'wepEdYrVaigs';
    if (!req.cookies.get(cookie_name)) {
      res.die("Unauthenticated.");
    }
    else {
      // mechturk(host_id, account_id);
      req.turk_client = mechturk_params.mechturk(m[2], m[1], {logger: logger});
      R.route(req, res);
    }
  });
};
