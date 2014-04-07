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


// /api/administrators/*
var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/administrators
List all administrators. */
R.get(/^\/api\/administrators$/, function(req, res, m) {
  db.Select('administrators')
  .orderBy('created DESC')
  .execute(function(err, administrators) {
    if (err) return res.die(err);
    res.ngjson(administrators);
  });
});

/** GET /api/administrators/new
Generate blank administrator. */
R.get(/^\/api\/administrators\/new/, function(req, res, m) {
  req.json({created: new Date()});
});

/** POST /api/administrators
Create new administrator. */
R.post(/^\/api\/administrators$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    models.Administrator.insert({
      email: data.email,
      password: hash.sha256(data.password),
    }, function(err, administrator) {
      if (err) return res.die(err);
      res.status(201).json(administrator);
    });
  });
});

/** GET /api/administrators/:id
Show existing administrator. */
R.get(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  models.Administrator.one({id: m[1]}, function(err, administrator) {
    if (err) return res.die(err);
    res.json(administrator);
  });
});

/** POST /api/administrators/:id
Update existing administrator. */
R.post(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    // var fields = _.pick(data, models.Administrator.columns);
    var fields = {email: data.email};
    // empty-string password means: don't change the password
    if (data.password) {
      fields.password = hash.sha256(data.password);
    }

    db.Update('administrators')
    .set(fields)
    .where('id = ?', m[1])
    .execute(function(err, rows) {
      if (err) return res.die(err);
      res.status(204).end(); // 204 No Content
    });
  });
});

/** DELETE /api/administrators/:administrator_id
Delete single administrator */
R.delete(/^\/api\/administrators\/(\d+)$/, function(req, res, m) {
  models.Administrator.delete({id: m[1]}, function(err) {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

// Administrator-AWS Account many2many relationship

/** POST /api/administrators/:administrator_id/aws_accounts/:aws_account_id
Create administrator-AWS account link */
R.post(/^\/api\/administrators\/(\d+)\/aws_accounts\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    db.Insert('aws_account_administrators')
    .set({
      administrator_id: m[1],
      aws_account_id: m[2],
      priority: data.priority,
    })
    .execute(function(err, rows) {
      if (err) return res.die(err);
      var aws_account_administrator = rows[0];
      res.status(201).json(aws_account_administrator);
    });
  });
});

/** DELETE /api/administrators/:administrator_id/aws_accounts/:aws_account_id
Delete administrator-AWS account link */
R.delete(/^\/api\/administrators\/(\d+)\/aws\/(\d+)$/, function(req, res, m) {
  db.Delete('aws_account_administrators')
  .where('administrator_id = ?', m[1])
  .where('aws_account_id = ?', m[2])
  .execute(function(err) {
    if (err) return res.die(err);
    // res.json({message: 'Disowned AWS account.'});
    res.status(204).end();
  });
});

module.exports = R.route.bind(R);
