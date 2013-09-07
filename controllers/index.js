'use strict'; /*jslint node: true, es5: true, indent: 2 */
var formidable = require('formidable');
var amulet = require('amulet');
var streaming = require('streaming');
var sv = require('sv');
var Router = require('regex-router');

var logger = require('../lib/logger');
var misc = require('../lib/misc');
var models = require('../lib/models');

var R = new Router();

// attach controllers
R.any(/^\/(static|favicon\.ico)/, require('./static'));
R.any(/^\/stimlists/, require('./stimlists'));
R.any(/^\/aircraft/, require('./aircraft'));
R.any(/^\/digits/, require('./digits'));
R.any(/^\/admin/, require('./admin')); // == ./admin/index

// POST /seen
R.post(/^\/seen$/, function(m, req, res) {
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    // and the fields: workerId, and "questionIds[]" that equates to a list of strings
    // which is just multiple 'questionIds[] = string1' fields (I think).
    var workerId = (fields.workerId || req.user_id).replace(/\W+/g, '');
    models.User.fromId(workerId, function(err, user) {
      if (err) return res.die('User query error: ' + err);
      if (!user) return res.die('No user "' + workerId + '" found.');

      var questionIds = fields['questionIds[]'];
      if (!Array.isArray(questionIds)) questionIds = questionIds ? [questionIds] : [];
      questionIds.forEach(function(questionId) {
        user.seen.push(questionId);
      });

      user.save(function(err) {
        if (err) logger.error('User.save error: ' + err);
      });

      // res.json({success: false, message: 'Could not find worker with ID: "' + workerId + '"'});
      res.json({success: true, message: 'Added ' + questionIds.length + ' to seen.'});
    });
  });
});

// POST /mturk/externalSubmit
R.post(/^\/mturk\/externalSubmit/, function(m, req, res) {
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    var workerId = fields.workerId || req.user_id;
    models.User.fromId(workerId, function(err, user) {
      if (err) return res.die('User query error: ' + err);
      if (!user) return res.die('No user "' + workerId + '" found.');

      user.responses.push(fields);
      user.save(function(err) {
        if (err) logger.error('User.save error: ' + err);
      });

      amulet.pipe(['layout.mu', 'done.mu'], {}).pipe(res);
    });
  });
});

// POST /responses
R.post(/^\/responses$/, function(m, req, res) {
  var workerId = req.user_id;
  req.readToEnd('utf8', function(err, data) {
    logger.debug('Saving response.', {workerId: workerId, data: data});

    var response = misc.parseJSON(data);
    if (response instanceof Error) {
      var message = 'Could not parse response, "' + data + '". Error: ' + response;
      return res.json({success: false, message: message});
    }

    response.created = new Date();
    models.User.update({_id: workerId}, {$push: {responses: response}}, function(err) {
      if (err) return res.json({success: false, message: 'User.update failed: ' + err});

      res.json({success: true, message: 'Saved response for user: ' + workerId});
    });
  });
});

// POST /addbonus
R.post(/^\/addbonus$/, function(m, req, res) {
  var default_bonus = 0.25;
  var max_bonus = 0.25;
  // var unpaid_minimum = 49;
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    var workerId = (fields.workerId || req.cookies.get('workerId') || 'none').replace(/\W+/g, '');
    models.User.fromId(workerId, function(err, user) {
      if (err) return res.die('User query error: ' + err);
      if (!user) return res.die('No user "' + workerId + '" found.');

      var amount = Math.min(parseFloat(fields.amount || default_bonus), max_bonus);
      var previous_bonus_owed = user.bonus_owed;

      user.bonus_owed = previous_bonus_owed + amount;
      user.save(function(err) {
        if (err) {
          logger.error(err);
          res.json({success: false, message: 'Error assigning bonus: ' + err.toString(), amount: amount});
        }
        else {
          logger.info('User bonus_owed increased from ' + previous_bonus_owed +
            ' by ' + amount + ' to ' + (previous_bonus_owed + amount) + '.');
          res.json({success: true, message: 'Bonus awarded: $' + amount, amount: amount});
        }
      });
    });
  });
});

/** POST /sv
parse csv-like input flexibly and write out json to response */
R.post(/^\/sv$/, function(m, req, res) {
  // res.writeHead(200, {'Content-Type': 'text/csv'});
  //   .pipe(new sv.Stringifier({delimiter: ','}))
  var parsed_stream = req.pipe(new sv.Parser());
  streaming.readToEnd(parsed_stream, function(err, rows) {
    if (err) return res.die('IO read error: ' + err);

    res.json(rows);
  });
});

/** GET /
root currently redirects to: /aircraft */
R.get(/^\/$/, function(m, req, res) {
  res.redirect('/aircraft');
});

R.default = function(m, req, res) {
  res.die(404, 'No resource at: ' + req.url);
};

module.exports = function(m, req, res) { R.route(req, res); };
