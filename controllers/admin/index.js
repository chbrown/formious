'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var sv = require('sv');
var querystring = require('querystring');
var mechturk = require('mechturk');
var amulet = require('amulet');
var async = require('async');
var Router = require('regex-router');

var logger = require('../../lib/logger');
var misc = require('../../lib/misc');
var models = require('../../lib/models');

// /admin/*
var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

// attach controllers requiring authentication
R.any(/^\/admin\/mt/, require('./mt'));
R.any(/^\/admin\/stimlists/, require('./stimlists'));
R.any(/^\/admin\/users/, require('./users'));

// GET /admin/responses.tsv (obsolete)
R.get(/\/admin\/responses.tsv/, function(req, res, m) {
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
  user_stream.on('error', function(err) {
    logger.error('User stream error', err);
  });
  user_stream.on('close', function () {
    stringifier.end();
  });
});
// GET /admin/responses/:page.json (obsolete)
R.get(/\/admin\/responses\/(\d+)\.json/, function(req, res, m) {
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

// GET /admin -> redirect to /admin/users
R.get(/\/admin\/?$/, function(req, res, m) {
  res.redirect('/admin/users');
});

// /admin/* -> handle auth and forward
module.exports = function(req, res) {
  // this is the checkpoint for all admin-level requests, and should drop all non-superusers
  var workerId = req.cookies.get('workerId');
  var ticket = req.cookies.get('ticket');
  models.User.withTicket(workerId, ticket, function(err, user) {
    if (err) {
      logger.error('User.withTicket(%s, %s) error', workerId, ticket, err);
      return res.die(err);
    }

    if (!user) {
      // this return is CRUCIAL!
      logger.info('User.withTicket(%s, %s) returned no user.', workerId, ticket);
      return res.die(err);
      // res.redirect('/users');
    }

    if (!user.superuser) {
      logger.info('User "%s" is not a superuser: 401', user._id);
      // this return is also CRUCIAL!
      return res.die(401, 'Access denied; your user account does not have superuser privileges.');
    }

    // alright, they're in. go wild.
    req.user = user;
    logger.debug('Authenticated with user: %s', user._id);
    R.route(req, res);
  });
};
