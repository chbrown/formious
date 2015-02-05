/*jslint node: true */
var _ = require('underscore');
var db = require('../../db');
var models = require('../../models');
var Router = require('regex-router');
var url = require('url');

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
    .setEqual(fields)
    .whereEqual({id: m[1]})
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

/** POST /api/access_tokens/generate

Example data:
  relation: experiments
  id: 23
  length: 10

Generate or find existing access token, and return it. */
R.post(/^\/api\/access_tokens\/generate(\?|$)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    // only allow 'experiments' from this API call, for the moment
    var relation = data.relation || null;
    if (relation != 'experiments') {
      relation = null;
    }
    var foreign_id = data.id || null;
    var length = parseInt(data.length || 10, null);

    // try to use an existing access token
    //   AccessToken.findOrCreate(relation, foreign_id, opts, callback)
    models.AccessToken.findOrCreate(relation, foreign_id, {length: length}, function(err, access_token) {
      if (err) return res.die(err);

      var url = ['', relation, foreign_id].join('/') + '?token=' + access_token.token;
      // setHeader is not chainable
      res.status(201).setHeader('Location', url);
      res.json(access_token);
    });

  });
});

module.exports = R.route.bind(R);
