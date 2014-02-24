/*jslint node: true */
var _ = require('underscore');
var logger = require('loge');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');

var db = require('../../../lib/db');
var models = require('../../../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/experiments/:experiment_id/stims
list all of an experiment's stims */
R.get(/stims(\/|.json)?$/, function(req, res, m) {

  new sqlcmd.Select({table: 'stims'})
  .where('experiment_id = ?', req.experiment.id)
  .orderBy('view_order')
  .execute(db, function(err, stims) {
    if (err) return res.die(err);

    req.ctx.stims = stims;
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/experiments/stims/all.mu']);
  });
});

/** POST /admin/experiments/:experiment_id/stims
Create new stim */
R.post(/stims\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    logger.error('POST stims fields: %j', data);
    for (var key in fields) {
      logger.info('k-v', key, fields[key]);
    }

    var fields = _.pick(data, 'template_id', 'context', 'view_order');

    new sqlcmd.Insert({table: 'stims'})
    .set({experiment_id: req.experiment.id})
    // also need to generate view_order!?
    .setIf(fields)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);

      res.json(rows[0]);
    });
  });
});

/** GET /admin/experiments/:experiment_id/stims/:stim_id
Show / edit single stim */
R.get(/stims\/(\d+)$/, function(req, res, m) {
  models.Stim.from({id: m[1]}, function(err, stim) {
    if (err) return res.die(err);

    req.ctx.stim = stim;
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/experiments/stims/one.mu']);
  });
});

/** PATCH /admin/experiments/:experiment_id/stims/:stim_id
Update existing stim. */
R.patch(/stims\/(\d+)$/, function(req, res, m) {
  models.Stim.from({id: m[1]}, function(err, stim) {
    if (err) return res.die(err);
    req.readForm(function(err, data) {
      if (err) return res.die(err);

      // empty-string password means: don't change the password
      // if (fields.password === '') delete fields.password;
      var fields = _.pick(data, 'email', 'password', 'created');
      // xxx: todo: handle the password better (hash it and stuff, if needed)!

      new sqlcmd.Update({table: 'stims'})
      .setIf(fields)
      .execute(db, function(err, rows) {
        if (err) return res.die(err);

        res.json(_.extend(stim, fields));
      });
    });
  });
});


/** PATCH /admin/administrators
Create new administrator. */
R.post(/^\/admin\/administrators\/(\d+)$/, function(req, res, m) {
  req.readForm(function(err, data) {
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

// req.experiment should be set before this module is called
module.exports = R.route.bind(R);
