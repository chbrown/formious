/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var async = require('async');
var logger = require('loge');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');
var sv = require('sv');

var models = require('../../../lib/models');
var db = require('../../../lib/db');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

// add single sub-controller (which handles per-account API calls, as opposed to the CRUD-type things below)
R.any(/^\/admin\/aws\/(\d+)\/hosts\/([^\/]+)/, require('./hosts'));

/** GET /admin/aws
Index - list all AWS accounts and show creation link */
R.get(/^\/admin\/aws(\/|.json)?$/, function(req, res) {
  models.AWSAccount.all({}, function(err, aws_accounts) {
    if (err) return res.die(err);

    req.ctx.aws_accounts = aws_accounts;
    amulet.stream(['admin/layout.mu', 'admin/aws/all.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/aws/new
Show empty AWS account form */
R.get('/admin/aws/new', function(req, res) {
  req.ctx.aws_account = {};
  amulet.stream(['admin/layout.mu', 'admin/aws/one.mu'], req.ctx).pipe(res);
});

/** POST /admin/aws
Create new experiment. */
R.post(/^\/admin\/aws\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.AWSAccount.columns);

    db.Insert('aws_accounts')
    .set(fields)
    .execute(function(err, rows) {
      if (err) return res.die(err);
      res.json(rows[0]);
    });
  });
});

/** GET /admin/aws/:account_id
Show single AWS account */
R.get(/^\/admin\/aws\/(\d+)$/, function(req, res, m) {
  var account_id = m[1];
  models.AWSAccount.one({id: account_id}, function(err, aws_account) {
    if (err) return res.die(err);

    req.ctx.aws_account = aws_account;
    amulet.stream(['admin/layout.mu', 'admin/aws/one.mu'], req.ctx).pipe(res);
  });
});

/** PATCH /admin/aws/:account_id
Update new AWS account */
R.patch(/^\/admin\/aws\/(\d+)$/, function(req, res, m) {
  var account_id = m[1];
  // models.AWSAccount.one({id: m[1]}, function(err, aws_account) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.AWSAccount.columns);

    db.Update('aws_accounts')
    .set(fields)
    .where('id = ?', account_id)
    .execute(function(err, rows) {
      if (err) return res.die(err);

      res.json(_.extend(data, fields));
    });
  });
});

/** DELETE /admin/aws/:account_id
Delete single AWS account */
R.delete(/^\/admin\/aws\/(\w*)$/, function(req, res, m) {
  var aws_account_id = m[1];
  db.Delete('aws_accounts')
  .where('id = ?', aws_account_id)
  .execute(function(err, rows) {
    if (err) return res.die(err);
    res.json({message: 'Deleted AWS Account.'});
  });
});

module.exports = R.route.bind(R);
