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
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/administrators
list all administrators */
R.get(/^\/admin\/administrators(\/|.json)?$/, function(req, res, m) {
  db.Select('administrators')
  .orderBy('created DESC')
  .execute(function(err, administrators) {
    if (err) return res.die(err);

    req.ctx.administrators = administrators;
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/administrators/all.mu']);
  });
});

/** GET /admin/administrators/new
Show/edit empty administrator */
R.get(/^\/admin\/administrators\/new/, function(req, res, m) {
  req.ctx.administrator = {
    created: new Date(),
  };
  res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/administrators/one.mu']);
});

/** POST /admin/administrators
Create new administrator. */
R.post(/^\/admin\/administrators\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    db.Insert('administrators')
    .set({
      email: data.email,
      password: hash.sha256(data.password),
    })
    .execute(function(err, rows) {
      if (err) return res.die(err);

      var url = '/admin/administrators/' + rows[0].id;
      res.redirect(200, url);
    });
  });
});

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
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/administrators/one.mu']);
  });
});

/** PATCH /admin/administrators/:administrator_id
Update existing administrator. */
R.patch(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  models.Administrator.one({id: m[1]}, function(err, administrator) {
    if (err) return res.die(err);
    req.readData(function(err, data) {
      if (err) return res.die(err);

      var fields = {email: data.email};
      // empty-string password means: don't change the password
      if (data.password) {
        fields.password = hash.sha256(data.password);
      }

      db.Update('administrators')
      .where('id = ?', administrator.id)
      .set(fields)
      .execute(function(err, rows) {
        if (err) return res.die(err);

        res.json(_.extend(administrator, fields));
      });
    });
  });
});

/** DELETE /admin/administrators/:administrator_id
Delete single administrator */
R.delete(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  models.Administrator.delete({id: m[1]}, function(err, administrator) {
    if (err) return res.die(err);

    res.json({message: 'Deleted administrator.'});
  });
});

// Administrator-AWS Account many2many relationship

/** POST /admin/administrators/:administrator_id/aws/:aws_account_id
Create administrator - AWS account link */
R.post(/^\/admin\/administrators\/(\d+)\/aws\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    db.Insert('aws_account_administrators')
    .set({
      administrator_id: m[1],
      aws_account_id: m[2],
      priority: data.priority,
    })
    .execute(function(err, rows) {
      if (err) return res.die(err);

      res.json({message: 'Linked AWS account.'});
    });
  });
});

/** DELETE /admin/administrators/:administrator_id/aws/:aws_account_id
Delete administrator - AWS account link */
R.delete(/^\/admin\/administrators\/(\d+)\/aws\/(\d+)$/, function(req, res, m) {
  db.Delete('aws_account_administrators')
  .where('administrator_id = ?', m[1])
  .where('aws_account_id = ?', m[2])
  .execute(function(err) {
    if (err) return res.die(err);

    res.json({message: 'Disowned AWS account.'});
  });
});

module.exports = R.route.bind(R);
