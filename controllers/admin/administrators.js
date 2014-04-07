/*jslint node: true */
var _ = require('underscore');
var async = require('async');
var sv = require('sv');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('loge');
var models = require('../../lib/models');
var hash = require('../../lib/hash');
var db = require('../../lib/db');

// /admin/administrators/*
var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /admin/administrators
List all administrators */
R.get(/^\/admin\/administrators$/, function(req, res, m) {
  db.Select('administrators')
  .orderBy('created DESC')
  .execute(function(err, administrators) {
    if (err) return res.die(err);

    req.ctx.administrators = administrators;
    amulet.stream(['admin/layout.mu', 'admin/administrators/all.mu'], req.ctx).pipe(res);
  });
});

// /** GET /admin/administrators/new
// Show/edit empty administrator */
// R.get(/^\/admin\/administrators\/new/, function(req, res, m) {
//   req.ctx.administrator = {
//     created: new Date(),
//   };
//   amulet.stream(['admin/layout.mu', 'admin/administrators/one.mu'], req.ctx).pipe(res);
// });

/** GET /admin/administrators/:administrator_id
Show/edit single administrator */
R.get(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  var administrator_id = m[1];
  async.auto({
    administrator: function(callback) {
      models.Administrator.one({id: administrator_id}, callback);
    },
    aws_accounts: function(callback) {
      db.Select('aws_account_administrators, aws_accounts')
      .where('aws_account_administrators.aws_account_id = aws_accounts.id')
      .where('aws_account_administrators.administrator_id = ?', administrator_id)
      .orderBy('aws_account_administrators.priority DESC')
      .execute(callback);
    },
  }, function(err, results) {
    if (err) return res.die(err);

    req.ctx.administrator = _.omit(results.administrator, 'password');
    req.ctx.aws_accounts = results.aws_accounts;

    amulet.stream(['admin/layout.mu', 'admin/administrators/one.mu'], req.ctx).pipe(res);
  });
});

module.exports = R.route.bind(R);
