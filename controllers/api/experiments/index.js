var _ = require('lodash');
var Router = require('regex-router');
var db = require('../../../db');

var R = new Router();

var experiments_columns = ['name', 'administrator_id', 'html'];

R.any(/^\/api\/experiments\/(\d+)\/blocks/, require('./blocks'));

/** GET /api/experiments
list all experiments */
R.get(/^\/api\/experiments$/, function(req, res) {
  db.Select([
    'experiments',
    'LEFT OUTER JOIN (SELECT experiment_id, COUNT(responses.id) FROM responses JOIN blocks ON blocks.id = responses.block_id GROUP BY experiment_id) AS responses ON responses.experiment_id = experiments.id',
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
R.post(/^\/api\/experiments$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, experiments_columns);

    db.Insert('experiments')
    .set(fields)
    .returning('*')
    .execute(function(err, rows) {
      if (err) return res.die(err);
      res.status(201).json(rows[0]);
    });
  });
});

/** GET /api/experiments/new
Generate blank experiment. */
R.get(/^\/api\/experiments\/new$/, function(req, res) {
  res.json({
    administrator_id: req.administrator.id,
    html: '',
  });
});

/** GET /api/experiments/:id
Show existing experiment. */
R.get(/^\/api\/experiments\/(\d+)$/, function(req, res, m) {
  db.SelectOne('experiments')
  .whereEqual({id: m[1]})
  .execute(function(err, experiment) {
    if (err) return res.die(err);
    res.json(experiment);
  });
});

/** POST /api/experiments/:id
Update existing experiment */
R.post(/^\/api\/experiments\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, experiments_columns);

    db.Update('experiments')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.die(err);
      res.status(204).end(); // 204 No Content
    });
  });
});

/** DELETE /api/experiments/:id
Delete experiment */
R.delete(/^\/api\/experiments\/(\d+)$/, function(req, res, m) {
  db.Delete('experiments')
  .whereEqual({id: m[1]})
  .execute(function(err) {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

module.exports = R.route.bind(R);
