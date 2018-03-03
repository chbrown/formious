var async = require('async');
var _ = require('lodash');
var Router = require('regex-router');

var db = require('../../../db');
var AccessToken = require('../../../models/AccessToken');
var Experiment = require('../../../models/Experiment');

var R = new Router();

R.any(/^\/api\/experiments\/(\d+)\/blocks/, require('./blocks'));

/**
Take a pre-joined (with access_tokens) row from the experiments table and insert
a new access_tokens row if there is no access_token available.
*/
function ensureAccessToken(experiment, callback) {
  if (experiment.access_token) {
    return setImmediate(function() {
      callback(null, experiment);
    });
  }

  // AccessToken.findOrCreate('experiments', experiment.id, {length: 10}, function(err, access_token) {
  db.InsertOne('access_tokens')
  .set({
    token: AccessToken.randomString(10),
    relation: 'experiments',
    foreign_id: experiment.id,
    // expires: experiment.expires,
  })
  .returning('*')
  .execute(function(err, access_token) {
    if (err) return callback(err);

    experiment.access_token = access_token.token;
    callback(null, experiment);
  });
}

/** GET /api/experiments
list all experiments */
R.get(/^\/api\/experiments$/, function(req, res) {
  db.Select([
    'experiments',
    'LEFT OUTER JOIN (SELECT experiment_id, COUNT(responses.id) AS responses_count FROM responses JOIN blocks ON blocks.id = responses.block_id GROUP BY experiment_id) AS responses ON responses.experiment_id = experiments.id',
    "LEFT OUTER JOIN access_tokens ON access_tokens.relation = 'experiments' AND access_tokens.foreign_id = experiments.id AND (access_tokens.expires < NOW() OR access_tokens.expires IS NULL) AND access_tokens.redacted IS NULL",
  ].join(' '))
  .add(['experiments.*', 'responses_count', 'access_tokens.token AS access_token'])
  .orderBy('created DESC')
  .execute(function(err, experiments) {
    if (err) return res.die(err);

    async.map(experiments, ensureAccessToken, function(err, experiments) {
      if (err) return res.die(err);
      res.json(experiments);
    });
  });
});

/** POST /api/experiments
Create new experiment. */
R.post(/^\/api\/experiments$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, Experiment.columns);

    db.InsertOne('experiments')
    .set(fields)
    .returning('*')
    .execute(function(err, experiment) {
      if (err) return res.die(err);
      res.status(201).json(experiment);
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
  db.SelectOne([
    'experiments',
    "LEFT OUTER JOIN access_tokens ON access_tokens.relation = 'experiments' AND access_tokens.foreign_id = experiments.id AND (access_tokens.expires < NOW() OR access_tokens.expires IS NULL) AND access_tokens.redacted IS NULL",
  ].join(' '))
  .add(['experiments.*', 'access_tokens.token AS access_token'])
  .whereEqual({'experiments.id': m[1]})
  .execute(function(err, experiment) {
    if (err) return res.die(err);

    ensureAccessToken(experiment, function(err, experiment) {
      if (err) return res.die(err);

      res.json(experiment);
    });
  });
});

/** POST /api/experiments/:id
Update existing experiment */
R.post(/^\/api\/experiments\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, Experiment.columns);

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
