/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var logger = require('loge');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');

var db = require('../../../lib/db');
var models = require('../../../lib/models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /admin/experiments/:experiment_id/stims
list all of an experiment's stims */
R.get(/stims(\/|.json)?$/, function(req, res, m) {

  db.Select('stims')
  .where('experiment_id = ?', req.experiment.id)
  .orderBy('view_order')
  .execute(function(err, stims) {
    if (err) return res.die(err);

    req.ctx.stims = stims;
    amulet.stream(['admin/layout.mu', 'admin/experiments/stims/all.mu'], req.ctx).pipe(res);
  });
});

/** POST /admin/experiments/:experiment_id/stims
Create new stim */
R.post(/stims\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Stim.columns);

    db.Insert('stims')
    // also need to generate view_order!?
    .set(fields)
    .execute(function(err, rows) {
      if (err) return res.die(err);

      res.json(rows[0]);
    });
  });
});

/** GET /admin/experiments/:experiment_id/stims/:stim_id
Show / edit single stim */
R.get(/stims\/(\d+)$/, function(req, res, m) {
  models.Stim.one({id: m[1]}, function(err, stim) {
    if (err) return res.die(err);

    req.ctx.stim = stim;
    amulet.stream(['admin/layout.mu', 'admin/experiments/stims/one.mu'], req.ctx).pipe(res);
  });
});

/** PATCH /admin/experiments/:experiment_id/stims/:stim_id
Update existing stim. */
R.patch(/stims\/(\d+)$/, function(req, res, m) {
  var stim_id = m[1];
  // models.Stim.one({id: stim_id}, function(err, stim) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Stim.columns);

    db.Update('stims')
    .set(fields)
    .where('id = ?', stim_id)
    .execute(function(err, rows) {
      if (err) return res.die(err);

      res.json(fields);
    });
  });
});

/** DELETE /admin/experiments/:experiment_id/stims/:stim_id
Delete Stim */
R.delete(/stims\/(\d+)$/, function(req, res, m) {
  var stim_id = m[1];

  // first delete the dependents
  db.Delete('responses')
  .where('stim_id = ?', stim_id)
  .execute(function(err, rows) {
    if (err) return res.die(err);

    // then delete the stim
    db.Delete('stims')
    .where('id = ?', m[1])
    .execute(function(err, rows) {
      if (err) return res.die(err);

      res.json({message: 'Deleted stim'});
    });
  });
});

module.exports = function(req, res, m) {
  // var m = req.url.match(/^\/admin\/experiments\/(\d+)\/stims/);
  models.Experiment.one({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);
    // set req.experiment before running anything else
    req.experiment = experiment;
    R.route(req, res);
  });
};
