/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var logger = require('loge');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');

var db = require('../../../lib/db');
var models = require('../../../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

var stims_controller = require('./stims');
/** ANY /admin/experiments/:experiment_id/stims/*
Forward /stims/ requests to sub controller */
R.any(/^\/admin\/experiments\/(\d+)\/stims/, function(req, res, m) {
  models.Experiment.from({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);

    req.experiment = experiment;
    stims_controller(req, res);
  });
});

/** GET /admin/experiments
list all Experiments */
R.get(/^\/admin\/experiments\/?$/, function(req, res, m) {
  new sqlcmd.Select({table: 'experiments'})
  .orderBy('created DESC')
  .execute(db, function(err, experiments) {
    if (err) return res.die(err);

    req.ctx.experiments = experiments;
    amulet.stream(['admin/layout.mu', 'admin/experiments/all.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/experiments/new
create new Experiment and redirect to edit it */
R.get(/^\/admin\/experiments\/new/, function(req, res, m) {
  req.ctx.experiment = {
    administrator_id: req.ctx.current_user.id,
  };
  amulet.stream(['admin/layout.mu', 'admin/experiments/one.mu'], req.ctx).pipe(res);
});

/** POST /admin/experiments
Create new experiment. */
R.post(/^\/admin\/experiments\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, 'name', 'administrator_id', 'parameters');

    new sqlcmd.Insert({table: 'experiments'})
    .setIf(fields)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);
      res.json(rows[0]);
    });
  });
});


/** GET /admin/experiments/:experiment_id
Edit existing Experiment (or just view) */
R.get(/^\/admin\/experiments\/(\d+)$/, function(req, res, m) {
  models.Experiment.from({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);

    logger.info('experiment/d', m[1], '>>', experiment);

    req.ctx.experiment = experiment;
    amulet.stream(['admin/layout.mu', 'admin/experiments/one.mu'], req.ctx).pipe(res);
  });
});

/** PUT /admin/experiments/
Insert new Experiment */
R.put(/^\/admin\/experiments\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, 'name', 'administrator_id', 'parameters');

    new sqlcmd.Insert({table: 'experiments'})
    .setIf(fields)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);

      // not sure how I feel about this special header business
      // res.setHeader('x-message', 'Experiment saved: ' + experiment._id);
      res.json(rows[0]);
    });
  });
});

/** PATCH /admin/experiments/:experiment_id
Update existing Experiment */
R.patch(/^\/admin\/experiments\/(\d+)/, function(req, res, m) {
  // models.Experiment.from({id: m[1]}, function(err, experiment) {
  var experiment = {id: m[1]};
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, 'name', 'administrator_id', 'parameters');

    new sqlcmd.Update({table: 'experiments'})
    .setIf(fields)
    .where('id = ?', experiment.id)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);

      // not sure how I feel about this special header business
      res.json(_.extend(experiment, fields));
    });
  });
});

/** DELETE /admin/experiments/:experiment_id
delete Experiment */
R.delete(/^\/admin\/experiments\/(\d+)$/, function(req, res, m) {
  new sqlcmd.Delete({table: 'experiments'})
  .where('id = ?', m[1])
  .execute(db, function(err, rows) {
    if (err) return res.die(err);

    res.json({message: 'Deleted experiment'});
  });
});

module.exports = R.route.bind(R);
