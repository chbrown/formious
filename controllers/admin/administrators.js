/*jslint node: true */
var _ = require('underscore');
var sv = require('sv');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('loge');
var models = require('../../lib/models');
var db = require('../../lib/db');
var sqlcmd = require('sqlcmd');

// /admin/administrators/*
var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/administrators
list all administrators */
R.get(/^\/admin\/administrators(\/|.json)?$/, function(req, res, m) {
  // var projection = '_id created responses.length bonus_paid bonus_owed password superuser tickets';
  new sqlcmd.Select({table: 'administrators'})
  .orderBy('created DESC')
  .execute(db, function(err, administrators) {
    if (err) return res.die(err);

    req.ctx.administrators = administrators;
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/administrators/all.mu']);
  });
});

/** GET /admin/administrators/new
Edit empty administrator */
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

    var fields = _.pick(data, 'email', 'password');

    new sqlcmd.Insert({table: 'administrators'})
    .setIf(fields)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);
      res.json(rows[0]);
    });
  });
});

/** GET /admin/administrators/:administrator_id
Show (and edit) single administrator */
R.get(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  models.Administrator.from({id: m[1]}, function(err, administrator) {
    if (err) return res.die(err);

    req.ctx.administrator = _.omit(administrator, 'password');
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/administrators/one.mu']);
  });
});

/** PATCH /admin/administrators/:administrator_id
Update existing administrator. */
R.patch(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  models.Administrator.from({id: m[1]}, function(err, administrator) {
    if (err) return res.die(err);
    req.readData(function(err, data) {
      if (err) return res.die(err);
      // empty-string password means: don't change the password
      // if (fields.password === '') delete fields.password;
      var fields = _.pick(data, 'email', 'password', 'created');
      // handle the password better (hash it and stuff, if needed)!

      new sqlcmd.Update({table: 'administrators'})
      .setIf(fields)
      .where('id = ?', administrator.id)
      .execute(db, function(err, rows) {
        if (err) return res.die(err);

        res.json(_.extend(administrator, fields));
      });
    });
  });
});

/** DELETE /admin/administrators/:administrator_id
Delete single administrator */
R.delete(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  models.Administrator.fromId(m[1], function(err, administrator) {
    if (err) return res.die(err);

    // db.table('administrators').Delete()
    new sqlcmd.Delete({table: 'administrators'})
    .where('id = ?', administrator.id)
    .execute(function(err) {
      if (err) return res.die(err);

      res.json({message: 'Deleted administrator: ' + administrator.email});
    });
  });
});

module.exports = R.route.bind(R);
