/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var async = require('async');
var logger = require('loge');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');
var url = require('url');

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
    parameters: [],
  };
  res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/experiments/one.mu']);
});

/** POST /admin/experiments
Create new experiment. */
R.post(/^\/admin\/experiments\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Experiment.columns);

    new sqlcmd.Insert({table: 'experiments'})
    .setIf(fields)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);

      res.redirect(200, '/admin/experiments/' + rows[0].id);
    });
  });
});

/** POST /admin/experiments/:id/clone
Create new experiment with properties of original (but not stims), and go to it. */
R.post(/^\/admin\/experiments\/(\d+)\/clone$/, function(req, res, m) {
  models.Experiment.from({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);

    var fields = _.pick(experiment, models.Experiment.columns);
    fields.name += ' copy';

    new sqlcmd.Insert({table: 'experiments'})
    .set(fields)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);

      // redirect so that we aren't sitting with the previous template's id in the url
      res.redirect('/admin/experiments/' + rows[0].id);
    });
  });
});


/** GET /admin/experiments/:experiment_id
Edit existing Experiment (or just view) */
R.get(/^\/admin\/experiments\/(\d+)(.json)?$/, function(req, res, m) {
  models.Experiment.from({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);

    req.ctx.experiment = experiment;
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/experiments/one.mu']);
  });
});

/** PATCH /admin/experiments/:experiment_id
Update existing Experiment */
R.patch(/^\/admin\/experiments\/(\d+)/, function(req, res, m) {
  // models.Experiment.from({id: m[1]}, function(err, experiment) {
  var experiment = {id: m[1]};
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Experiment.columns);

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
Delete Experiment */
R.delete(/^\/admin\/experiments\/(\d+)$/, function(req, res, m) {
  new sqlcmd.Delete({table: 'experiments'})
  .where('id = ?', m[1])
  .execute(db, function(err, rows) {
    if (err) return res.die(err);

    res.json({message: 'Deleted experiment'});
  });
});

/** GET /admin/experiments/:experiment_id/responses
Redirect to a page with ad-hoc authorization */
R.get(/^\/admin\/experiments\/(\d+)\/responses(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];
  // should this be a POST?

  // try to use an existing access token
  models.AccessToken.findOrCreate('experiments', experiment_id, {length: 10}, function(err, token) {
    if (err) return res.die(err);
    logger.info('Using token: %s, to access experiment %s', token, experiment_id);

    var url = '/experiments/' + experiment_id + '/responses?token=' + token;
    res.redirect(url);
  });
});

module.exports = R.route.bind(R);
