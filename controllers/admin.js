'use strict'; /*jslint node: true, es5: true, indent: 2 */
var querystring = require('querystring');
var sv = require('sv');
var mechturk = require('mechturk');
var logger = require('../logger');
var amulet = require('amulet');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var Router = require('regex-router');
var models = require('../models');

var R = new Router();
var authR = new Router();

// /admin
module.exports = function(m, req, res) {
  var workerId = req.cookies.get('workerId');
  var ticket = req.cookies.get('ticket');
  models.User.withTicket(workerId, ticket, function(err, user) {
    logger.maybe(err);
    if (user && user.superuser) {
      req.user = user;
      authR.route(req, res);
    }
    else {
      logger.info('User not allowed; redirecting.');
      R.route(req, res);
    }
  });
};

// ############
// unauthorized

// go to /admin/users to login
// then you can either:
//  1. claim your current workerId
//  2. become a different user

R.get(/^\/admin\/users\/(\w+)/, function(m, req, res) {
  var workerId = m[1].replace(/\W+/g, '');
  models.User.fromId(workerId, function(err, user) {
    logger.maybe(err);
    var ctx = {user: user};
    amulet.stream(['layout.mu', 'admin/users/login.mu'], ctx).pipe(res);
  });
});

R.post(/^\/admin\/users\/(\w+)\/claim/, function(m, req, res) {
  var workerId = m[1].replace(/\W+/g, '');
  req.wait(function() {
    var fields = querystring.parse(req.data);
    // logger.debug(req.url + ' :: ' + workerId, fields);
    models.User.fromId(workerId, function(err, user) {
      logger.maybe(err);
      if (user.password) {
        res.die('User/claim failed. Password already set.');
      }
      else {
        // var claimable = user === undefined;
        user.setPassword(fields.password, function(err) {
          var ticket = _.last(user.tickets);
          req.cookies.set('workerId', user._id);
          req.cookies.set('ticket', ticket);
          var ctx = {user: user, authorized: true};
          amulet.stream(['layout.mu', 'admin/users/one.mu'], ctx).pipe(res);
        });
      }
    });
  });
});

R.post(/^\/admin\/users\/(\w+)\/become/, function(m, req, res) {
  var workerId = m[1].replace(/\W+/g, '');
  req.wait(function() {
    var fields = querystring.parse(req.data);
    models.User.withPassword(workerId, fields.password, function(err, user) {
      if (err || !user) {
        logger.error(err);
        res.die('User/become failed. WorkerId and/or password is incorrect.');
      }
      else {
        var ticket = _.last(user.tickets);
        req.cookies.set('workerId', user._id);
        req.cookies.set('ticket', ticket);
        var ctx = {user: user, authorized: true};
        amulet.stream(['layout.mu', 'admin/users/one.mu'], ctx).pipe(res);
      }
    });
  });
});

R.get(/^\/admin\/users/, function(m, req, res) {
  var workerId = req.cookies.get('workerId') || 'public';
  models.User.fromId(workerId, function(err, user) {
    res.redirect('/admin/users/' + user._id);
  });
});

// ##########
// authorized

authR.default = function(m, req, res) {
  res.die('No route at: ' + req.url); // m[1] == req.url here
};

// ------------
// GET /admin/users -> list all users.
authR.get(/^\/admin\/users$/, function(m, req, res) {
  models.User.find({}).exec(function(err, users) {
    logger.maybe(err);
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/all.mu'], {users: users}).pipe(res);
  });
});

// GET /admin/users/:user -> show single user
authR.get(/^\/admin\/users\/(\w+)/, function(m, req, res) {
  var workerId = m[1].replace(/\W+/g, '');
  models.User.fromId(workerId, function(err, user) {
    logger.maybe(err);
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/one.mu'], {user: user}).pipe(res);
  });
});


// ---------------
// /admin/mt
// GET /admin/mt -> List all AWS MTurk Accounts and show creation form
authR.get(/^\/admin\/mt$/, function(m, req, res) {
  models.Account.find({}).exec(function(err, accounts) {
    logger.maybe(err);
    var ctx = {
      user: req.user,
      accounts: accounts,
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/mt/all.mu'], ctx).pipe(res);
  });
});
// GET /admin/mt/:account
authR.get(/^\/admin\/mt\/(\w*)$/, function(m, req, res) {
  models.Account.findById(m[1], function(err, account) {
    logger.maybe(err);
    var ctx = {
      user: req.user,
      account: account,
      hosts: ['deploy', 'sandbox'],
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/mt/one.mu'], ctx).pipe(res);
  });
});
// DELETE /admin/mt/:account -> List all AWS MTurk Accounts and show creation form
authR.delete(/^\/admin\/mt\/(\w*)$/, function(m, req, res) {
  models.Account.findOne({_id: m[1]}).remove(function(err) {
    logger.maybe(err);
    res.json({success: true, message: 'Deleted account, ' + m[1]});
  });
});
// POST /admin/mt/:account -> Add AWS MTurk Account
authR.post(/^\/admin\/mt\/(\w*)$/, function(m, req, res) {
  req.wait(function() {
    var fields = querystring.parse(req.data);
    fields._id = fields._id || m[1];
    var account = new models.Account(fields);
    account.save(function(err) {
      logger.maybe(err);
      res.redirect('/admin/mt');
    });
  });
});

authR.any(/^\/admin\/mt\/(\w+)\/(\w+)/, require('./admin/mt'));


// Unused
authR.get(/\/admin\/responses.tsv/, function(m, req, res) {
  var stringifier = new sv.Stringifier({delimiter: '\t'});
  res.writeHead(200, {'Content-Type': 'text/plain'});
  stringifier.pipe(res);

  var user_stream = models.User.find({
    workerId: /^A/,
    responses: {$ne: []},
  }).sort('-created').stream();

  // flattenArrayProperty(r, 'reliabilities', 'reliability');
  // flattenArrayProperty(r, 'judgments', 'judgment');
  user_stream.on('data', function (user) {
    user.responses.forEach(function(response) {
      // ISO8601-ify dates
      for (var key in response) {
        if (response[key] instanceof Date) {
          response[key] = response[key].toISOString().replace(/\..+$/, '');
        }
      }
      stringifier.write(response);
    });
  });
  user_stream.on('error', logger.maybe);
  user_stream.on('close', function () {
    stringifier.end();
  });
});

// Unused
authR.get(/\/admin\/responses\/(\d+)\.json/, function(m, req, res) {
  var page = parseInt(m[1], 10);
  var per_page = 10;
  var query = models.User
    .find({responses: {$ne: []}})
    .skip(page*per_page)
    .limit(per_page)
    .sort('-created');
  query.exec(function(err, users) {
    var responses = [].concat(_.pluck(users, 'responses'));
    res.json(responses);
  });
});
