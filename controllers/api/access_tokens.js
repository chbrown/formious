/*jslint node: true */
var _ = require('underscore');
var Router = require('regex-router');
var db = require('../../lib/db');
var models = require('../../lib/models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/access_tokens
List all access tokens. */
R.get(/^\/api\/access_tokens$/, function(req, res, m) {
  db.Select('access_tokens')
  .orderBy('id ASC')
  .execute(function(err, access_tokens) {
    if (err) return res.die(err);
    res.ngjson(access_tokens);
  });
});

/** GET /api/access_tokens/new
Generate blank access token. */
R.get(/^\/api\/access_tokens\/new$/, function(req, res, m) {
  res.json({});
});

/** POST /api/access_tokens
Create new access token. */
R.post(/^\/api\/access_tokens$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.AccessToken.columns);
    models.AccessToken.insert(fields, function(err, access_token) {
      if (err) return res.die(err);
      res.status(201).json(access_token);
    });
  });
});

/** GET /api/access_tokens/:id
Show existing access token. */
R.get(/^\/api\/access_tokens\/(\d+)$/, function(req, res, m) {
  models.AccessToken.one({id: m[1]}, function(err, access_token) {
    if (err) return res.die(err);
    res.json(access_token);
  });
});

/** POST /api/access_tokens/:id
Update existing access token. */
R.post(/^\/api\/access_tokens\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.AccessToken.columns);

    db.Update('access_tokens')
    .set(fields)
    .where('id = ?', m[1])
    .execute(function(err, rows) {
      if (err) return res.die(err);
      res.status(204).end(); // 204 No Content
    });
  });
});

/** DELETE /api/access_tokens/:id
Delete existing access token. */
R.delete(/^\/api\/access_tokens\/(\d+)$/, function(req, res, m) {
  models.AccessToken.delete({id: m[1]}, function(err) {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

module.exports = R.route.bind(R);
