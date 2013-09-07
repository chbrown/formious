'use strict'; /*jslint node: true, es5: true, indent: 2 */
var querystring = require('querystring');
var _ = require('underscore');
var sv = require('sv');
var amulet = require('amulet');
var async = require('async');
var Router = require('regex-router');

// var logger = require('../../../lib/logger');
var models = require('../../../lib/models');

var R = new Router();

// set up single sub-controller (which handles per-account API calls, as opposed to the CRUD-type things below)
R.any(/^\/admin\/mt\/(\w+)\/(\w+)/, require('./api'));

/** GET /admin/mt
List all AWS MTurk accounts and show creation form */
R.get(/^\/admin\/mt$/, function(m, req, res) {
  models.AWSAccount.find({}, function(err, accounts) {
    if (err) return res.die(err);

    var ctx = {
      user: req.user,
      accounts: accounts,
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/mt/all.mu'], ctx).pipe(res);
  });
});
/** POST /admin/mt
Create new AWS MTurk account */
R.post(/^\/admin\/mt$/, function(m, req, res) {
  req.readToEnd('utf8', function(err, data) {
    if (err) return res.die(err);

    var account = _.extend({_id: m[1]}, querystring.parse(data));
    new models.AWSAccount(account).save(function(err, account) {
      if (err) return res.die(err);

      res.redirect('/admin/mt/' + account._id);
    });
  });
});
/** GET /admin/mt/:account
Show single AWS MTurk account */
R.get(/^\/admin\/mt\/(\w*)$/, function(m, req, res) {
  models.AWSAccount.findById(m[1], function(err, account) {
    if (err) return res.die(err);

    var ctx = {
      user: req.user,
      account: account,
      hosts: ['deploy', 'sandbox'],
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/mt/one.mu'], ctx).pipe(res);
  });
});
/** DELETE /admin/mt/:account
Delete single AWS MTurk account */
R.delete(/^\/admin\/mt\/(\w*)$/, function(m, req, res) {
  models.AWSAccount.findById(m[1], function (err, account) {
    if (err) return res.json({success: false, message: err});

    if (!account) return res.json({success: false, message: 'Could not find account: ' + m[1]});

    account.remove(function(err) {
      if (err) return res.json({success: false, message: err});

      res.json({success: true, message: 'Deleted account: ' + account._id});
    });
  });
});

R.default = function(m, req, res) {
  res.die(404, 'No resource at: ' + req.url);
};

module.exports = function(m, req, res) { R.route(req, res); };
