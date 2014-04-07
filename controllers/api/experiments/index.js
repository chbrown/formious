/*jslint node: true */
var _ = require('underscore');
var Router = require('regex-router');
var db = require('../../../lib/db');
var models = require('../../../lib/models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

R.any(/^\/api\/experiments\/(\d+)\/stims/, require('./stims'));

/** GET /api/experiments
list all experiments */
R.get(/^\/api\/experiments$/, function(req, res, m) {
  db.Select([
    'experiments',
    'LEFT OUTER JOIN (SELECT experiment_id, COUNT(responses.id) FROM responses JOIN stims ON stims.id = responses.stim_id GROUP BY experiment_id) AS responses ON responses.experiment_id = experiments.id',
  ].join(' '))
  .orderBy('created DESC')
  .execute(function(err, experiments) {
    if (err) return res.die(err);
    // experiments is a list, so we use ngjson
    res.ngjson(experiments);
  });
});

/** POST /api/experiments
Create new experiment. */
R.post(/^\/api\/experiments$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Experiment.columns);
    models.Experiment.insert(fields, function(err, experiment) {
      if (err) return res.die(err);
      res.status(201).json(experiment);
    });
  });
});

/** GET /api/experiments/new
Generate blank experiment. */
R.get(/^\/api\/experiments\/new$/, function(req, res, m) {
  res.json({
    administrator_id: req.ctx.current_user.id,
    html: '',
    parameters: [],
  });
});

/** GET /api/experiments/:id
Show existing experiment. */
R.get(/^\/api\/experiments\/(\d+)$/, function(req, res, m) {
  models.Experiment.one({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);
    res.json(experiment);
  });
});

/** POST /api/experiments/:id
Update existing experiment */
R.post(/^\/api\/experiments\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Experiment.columns);

    db.Update('experiments')
    .set(fields)
    .where('id = ?', m[1])
    .execute(function(err, rows) {
      if (err) return res.die(err);

      // var experiment = rows[1];
      // res.json(_.extend(experiment, fields));
      res.status(204).end(); // 204 No Content
    });
  });
});

/** DELETE /api/experiments/:id
Delete experiment */
R.delete(/^\/api\/experiments\/(\d+)$/, function(req, res, m) {
  models.Experiment.delete({id: m[1]}, function(err) {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

// non-REST:

/** POST /api/experiments/:id/clone
Create new experiment with properties of original (but not stims) */
R.post(/^\/api\/experiments\/(\d+)\/clone$/, function(req, res, m) {
  models.Experiment.one({id: m[1]}, function(err, experiment) {
    if (err) return res.die(err);

    var fields = _.pick(experiment, models.Experiment.columns);
    fields.name += ' copy';

    models.Experiment.insert(fields, function(err, experiment) {
      if (err) return res.die(err);
      res.status(201).json(experiment);
    });
  });
});

module.exports = R.route.bind(R);
