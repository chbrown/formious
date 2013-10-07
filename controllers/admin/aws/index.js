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

// add single sub-controller (which handles per-account API calls, as opposed to the CRUD-type things below)
R.any(/^\/admin\/aws\/([^\/]+)\/hosts\/([^\/]+)/, require('./hosts'));

/** GET /admin/aws
Index - list all AWS accounts and show creation link */
R.get('/admin/aws', function(req, res) {
  models.AWSAccount.find({}, function(err, accounts) {
    if (err) return res.die(err);

    req.ctx.accounts = accounts;
    amulet.stream(['admin/layout.mu', 'admin/aws/all.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/aws/new
Create new AWS account and redirect to edit it */
R.get('/admin/aws/new', function(req, res) {
  models.AWSAccount.create({}, function(err, account) {
    if (err) return res.die('new AWSAccount error: ' + err);

    res.redirect('/admin/aws/' + account._id + '/edit');
  });
});

/** GET /admin/aws/:account_id
Show single AWS account */
R.get(/^\/admin\/aws\/(\w*)$/, function(req, res, m) {
  var _id = m[1];
  models.AWSAccount.findById(_id, function(err, account) {
    if (err) return res.die(err);
    if (!account) return res.die(404, 'Could not find AWS Account: ' + _id);

    _.extend(req.ctx, {
      account: account,
      hosts: ['deploy', 'sandbox'],
    });
    amulet.stream(['admin/layout.mu', 'admin/aws/one.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/aws/:account_id/edit
Edit single user */
R.get(/^\/admin\/aws\/(\w+)\/edit$/, function(req, res, m) {
  var _id = m[1];
  models.AWSAccount.findById(_id, function(err, account) {
    if (err) return res.die('AWS Account query error: ' + err);
    if (!account) return res.die(404, 'Could not find AWS Account: ' + _id);

    _.extend(req.ctx, {
      account: account,
      hosts: ['deploy', 'sandbox'],
    });
    amulet.stream(['admin/layout.mu', 'admin/aws/edit.mu'], req.ctx).pipe(res);
  });
});

/** POST /admin/aws/:account_id
Update new AWS account */
R.post(/^\/admin\/aws\/(\w*)$/, function(req, res, m) {
  var _id = m[1];
  models.AWSAccount.findById(_id, function(err, account) {
    if (err) return res.die('AWS Account query error: ' + err);
    if (!account) return res.die(404, 'Could not find AWS Account: ' + _id);

    req.readToEnd('utf8', function(err, data) {
      if (err) return res.die(err);

      var values = querystring.parse(data);
      // account.extendSave lets you change the account's _id, transparently
      account.extendSave(values, function(err, account) {
        if (err) return res.die('account.save error: ' + err);

        res.redirect('/admin/aws/' + account._id);
      });
    });
  });
});

/** DELETE /admin/aws/:account_id
Delete single AWS account */
R.delete(/^\/admin\/aws\/(\w*)$/, function(req, res, m) {
  var _id = m[1];
  models.AWSAccount.findById(_id, function(err, account) {
    if (err) return res.die('AWS Account query error: ' + err);
    if (!account) return res.die(404, 'Could not find AWS Account: ' + _id);

    account.remove(function(err) {
      if (err) return res.die('AWS Account remove error: ' + err);

      res.json({success: true, message: 'Deleted account: ' + account._id});
    });
  });
});

module.exports = R.route.bind(R);
