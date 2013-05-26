#!/usr/bin/env node
'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
// var agent = require('webkit-devtools-agent');
var path = require('path');
var amulet = require('amulet');
var formidable = require('formidable');
var http = require('http-enhanced');
var Cookies = require('cookies');
var Router = require('regex-router');
var logger = require('./logger');
var models = require('./models');
var User = models.User;
var argv = require('optimist').default({port: 1451, hostname: '127.0.0.1'}).argv;

amulet.set({minify: true, root: path.join(__dirname, 'layouts')});

Cookies.prototype.defaults = function() {
  var expires = new Date(Date.now() + 31*86400 *1000); // 1 month
  return {expires: expires};
};

var R = new Router();

R.get(/\/favicon.ico/, function(m, req, res) {
  res.writeHead(404);
  res.end();
});

// attach independent routes
require('./aircraft')(R);
require('./digits')(R);
require('./admin')(R);

R.default = function(m, req, res) {
  var default_url = '/aircraft';
  console.log('Redirecting request for ' + req.url + ' to ' + default_url);
  res.redirect(default_url);
};

// Generic actions:

R.post(/^\/seen$/, function(m, req, res) {
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    // and the fields: workerId, and "questionIds[]" that equates to a list of strings
    // which is just multiple 'questionIds[] = string1' fields (I think).
    var workerId = (req.cookies.get('workerId') || fields.workerId || 'none').replace(/\W+/g, '');
    User.findById(workerId, function(err, user) {
      logger.maybe(err);
      if (user) {
        var questionIds = fields['questionIds[]'];
        if (!Array.isArray(questionIds)) questionIds = questionIds ? [questionIds] : [];
        questionIds.forEach(function(questionId) {
          user.seen.push(questionId);
        });
        user.save(logger.maybe);
        res.json({success: true, message: 'Added ' + questionIds.length + ' to seen.'});
      }
      else {
        res.json({success: false, message: 'Could not find worker with ID: "' + workerId + '"'});
      }
    });
  });
});

R.post(/^\/mturk\/externalSubmit/, function(m, req, res) {
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    var workerId = (fields.workerId || req.cookies.get('workerId') || 'none').replace(/\W+/g, '');
    User.findById(workerId, function(err, user) {
      logger.maybe(err);
      if (user) {
        user.responses.push(fields);
        user.save(logger.maybe);
      }
      amulet.render(res, ['layout.mu', 'done.mu'], {});
    });
  });
});

R.any(/^\/responses/, function(m, req, res) {
  var workerId = (req.cookies.get('workerId') || 'none').replace(/\W+/g, '');
  logger.info('Saving response.', {workerId: workerId});
  req.on('end', function() {
    // need to check this json parse
    var response = JSON.parse(req.data);
    response.submitted = new Date();
    User.findById(workerId, function(err, user) {
      logger.maybe(err);
      if (user) {
        user.responses.push(response);
        user.save(logger.maybe);
      }
      res.json({success: true, message: 'Saved response for user: ' + workerId});
    });
  });
});

R.post(/\/addbonus/, function(m, req, res) {
  var default_bonus = 0.25;
  var max_bonus = 0.25;
  // var unpaid_minimum = 49;
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    var workerId = (fields.workerId || req.cookies.get('workerId') || 'none').replace(/\W+/g, '');
    User.findById(workerId, function(err, user) {
      logger.maybe(err);
      if (user) {
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
      }
      else {
        res.json({success: false, message: 'Could not find user: ' + workerId});
      }
    });
  });
});

http.createServer(function(req, res) {
  req.saveData();
  req.cookies = new Cookies(req, res);

  var started = Date.now();
  res.end = function() {
    logger.info('duration', {url: req.url, method: req.method, ms: Date.now() - started});
    http.ServerResponse.prototype.end.apply(res, arguments);
  };

  R.route(req, res);
}).listen(argv.port, argv.hostname, function() {
  logger.info('Turkserv ready at ' + argv.hostname + ':' + argv.port);
});
