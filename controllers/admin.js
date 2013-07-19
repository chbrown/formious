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

// GET /admin/users/:user
R.get(/^\/admin\/users\/(\w+)/, function(m, req, res) {
  var workerId = m[1].replace(/\W+/g, '');
  models.User.fromId(workerId, function(err, user) {
    logger.maybe(err);
    var ctx = {user: user};
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/login.mu'], ctx).pipe(res);
  });
});

// GET /admin/users/:user/claim
R.post(/^\/admin\/users\/(\w+)\/claim/, function(m, req, res) {
  var workerId = m[1].replace(/\W+/g, '');
  req.readToEnd('utf8', function(err, data) {
    var fields = querystring.parse(data);
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
          amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/one.mu'], ctx).pipe(res);
        });
      }
    });
  });
});

// GET /admin/users/:user/become
R.post(/^\/admin\/users\/(\w+)\/become/, function(m, req, res) {
  var workerId = m[1].replace(/\W+/g, '');
  req.readToEnd('utf8', function(err, data) {
    logger.maybe(err);
    var fields = querystring.parse(data);
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
        amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/users/one.mu'], ctx).pipe(res);
      }
    });
  });
});

// GET /admin/users
R.get(/^\/admin\/users/, function(m, req, res) {
  var workerId = req.cookies.get('workerId') || 'public';
  models.User.fromId(workerId, function(err, user) {
    res.redirect('/admin/users/' + user._id);
  });
});

// GET /admin -> redirect to /admin/users/:worker
R.default = function(m, req, res) {
  var workerId = req.cookies.get('workerId') || 'public';
  models.User.fromId(workerId, function(err, user) {
    res.redirect('/admin/users/' + user._id);
  });
};


// ##########
// authorized

authR.default = function(m, req, res) {
  res.redirect('/admin/mt');
  // res.die('No route at: ' + req.url); // m[1] == req.url here
};

// ------------
// GET /admin/users -> list all users.
authR.get(/^\/admin\/users$/, function(m, req, res) {
  models.User.find({}, '_id created responses.length bonus_paid bonus_owed password superuser tickets.length', function(err, users) {
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
  models.AWSAccount.find({}, function(err, accounts) {
    logger.maybe(err);
    var ctx = {
      user: req.user,
      accounts: accounts,
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/mt/all.mu'], ctx).pipe(res);
  });
});
// POST /admin/mt/:account -> Create new AWS MTurk Account
authR.post(/^\/admin\/mt$/, function(m, req, res) {
  req.readToEnd('utf8', function(err, data) {
    logger.maybe(err);
    var fields = _.extend({_id: m[1]}, querystring.parse(data));
    var account = new models.AWSAccount(fields);
    account.save(function(err) {
      logger.maybe(err);
      res.redirect('/admin/mt');
    });
  });
});
// GET /admin/mt/:account -> Show single AWS Account
authR.get(/^\/admin\/mt\/(\w*)$/, function(m, req, res) {
  models.AWSAccount.findById(m[1], function(err, account) {
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
  models.AWSAccount.findById(m[1], function (err, account) {
    logger.maybe(err);
    if (account) {
      account.remove(function(err) {
        if (err) {
          logger.maybe(err);
          res.json({success: false, message: err.toString()});
        }
        else {
          res.json({success: true, message: 'Deleted account: ' + account._id});
        }
      });
    }
    else {
      res.json({success: false, message: 'Could not find account: ' + m[1]});
    }
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
