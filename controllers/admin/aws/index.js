'use strict'; /*jslint node: true, es5: true, indent: 2 */
var querystring = require('querystring');
var _ = require('underscore');
var sv = require('sv');
var amulet = require('amulet');
var async = require('async');
var Router = require('regex-router');

var logger = require('../../../lib/logger');
// var misc = require('../../../lib/misc');
var models = require('../../../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

// set up single sub-controller (which handles per-account API calls, as opposed to the CRUD-type things below)
R.any(/^\/admin\/aws\/([^\/]+)\/hosts\/([^\/]+)/, require('./hosts'));

/** GET /admin/aws
Index - list all AWS accounts and show creation link */
R.get('/admin/aws', function(req, res) {
  models.AWSAccount.find({}, function(err, accounts) {
    if (err) return res.die(err);

    var ctx = {
      user: req.user,
      accounts: accounts,
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/aws/all.mu'], ctx).pipe(res);
  });
});

/** GET /admin/aws/new
Create new AWS account and redirect to edit it */
R.get('/admin/aws/new', function(req, res) {
  new models.AWSAccount().save(function(err, account) {
    if (err) return res.die('new AWSAccount error: ' + err);

    res.redirect('/admin/aws/' + account._id + '/edit');
  });
});

/** GET /admin/aws/:account_id
Show single AWS account */
R.get(/^\/admin\/aws\/(\w*)$/, function(req, res, m) {
  models.AWSAccount.findById(m[1], function(err, account) {
    if (err) return res.die(err);

    var ctx = {
      user: req.user,
      account: account,
      hosts: ['deploy', 'sandbox'],
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/aws/one.mu'], ctx).pipe(res);
  });
});

/** GET /admin/aws/:account_id/edit
Edit single user */
R.get(/^\/admin\/aws\/(\w+)\/edit$/, function(req, res, m) {
  models.AWSAccount.findById(m[1], function(err, account) {
    if (err) return res.die('AWSAccount query error: ' + err);

    var ctx = {
      user: req.user,
      account: account,
      hosts: ['deploy', 'sandbox'],
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/aws/edit.mu'], ctx).pipe(res);
  });
});

/** POST /admin/aws/:account_id
Update new AWS account */
R.post(/^\/admin\/aws\/(\w*)$/, function(req, res, m) {
  models.AWSAccount.findById(m[1], function(err, account) {
    if (err) return res.die(err);

    req.readToEnd('utf8', function(err, data) {
      if (err) return res.die(err);

      _.extend(account, querystring.parse(data));
      account.save(function(err, account) {
        if (err) return res.die('account.save error: ' +err);

        res.redirect('/admin/aws/' + account._id);
      });
    });
  });
});

/** DELETE /admin/aws/:account_id
Delete single AWS account */
R.delete(/^\/admin\/aws\/(\w*)$/, function(req, res, m) {
  models.AWSAccount.findById(m[1], function (err, account) {
    if (err) return res.json({success: false, message: err});

    if (!account) return res.json({success: false, message: 'Could not find account: ' + m[1]});

    account.remove(function(err) {
      if (err) return res.json({success: false, message: err});

      res.json({success: true, message: 'Deleted account: ' + account._id});
    });
  });
});

module.exports = R.route.bind(R);
