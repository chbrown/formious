/*jslint node: true */
var _ = require('underscore');
var Router = require('regex-router');
var db = require('../../../db');
var models = require('../../../models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/experiments/:experiment_id/stims
list all of an experiment's stims */
R.get(/\/api\/experiments\/(\d+)\/stims$/, function(req, res, m) {
  db.Select('stims')
  .where('experiment_id = ?', m[1])
  .orderBy('view_order')
  .execute(function(err, stims) {
    if (err) return res.die(err);

    res.ngjson(stims);
  });
});

/** POST /api/experiments/:experiment_id/stims
Create new stim */
R.post(/\/api\/experiments\/(\d+)\/stims$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Stim.columns);
    fields.experiment_id = m[1];
    models.Stim.insert(fields, function(err, stim) {
      if (err) return res.die(err);
      res.status(201).json(stim);
    });
  });
});

/** GET /api/experiments/:experiment_id/stims/:stim_id
Create blank stim */
R.get(/\/api\/experiments\/(\d+)\/stims\/new$/, function(req, res, m) {
  // blank stim
  res.json({experiment_id: m[1]});
});

/** GET /api/experiments/:experiment_id/stims/:stim_id
Show stim details */
R.get(/\/api\/experiments\/(\d+)\/stims\/(\d+)$/, function(req, res, m) {
  models.Stim.one({experiment_id: m[1], id: m[2]}, function(err, stim) {
    if (err) return res.die(err);
    res.json(stim);
  });
});

/** POST /api/experiments/:experiment_id/stims/:stim_id
Update existing stim */
R.post(/\/api\/experiments\/(\d+)\/stims\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Stim.columns);

    db.Update('stims')
    .setEqual(fields)
    .whereEqual({experiment_id: m[1], id: m[2]})
    .execute(function(err, rows) {
      if (err) return res.die(err);
      // 204 No content
      res.status(204).end();
    });
  });
});

/** DELETE /api/experiments/:experiment_id/stims/:stim_id
Delete stim */
R.delete(/\/api\/experiments\/(\d+)\/stims\/(\d+)$/, function(req, res, m) {
  // will fail if this stim has any responses
  var stim_id = m[1];
  models.Stim.delete({experiment_id: m[1], id: m[2]}, function(err) {
    if (err) return res.die(err);
    // 204 No content
    res.status(204).end();
  });
});

module.exports = R.route.bind(R);
