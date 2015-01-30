/*jslint node: true */
var _ = require('underscore');
var Router = require('regex-router');
var db = require('../../db');
var models = require('../../models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** GET /api/templates
List all templates. */
R.get(/^\/api\/templates$/, function(req, res, m) {
  db.Select('templates')
  .orderBy('id ASC')
  .execute(function(err, templates) {
    if (err) return res.die(err);
    res.ngjson(templates);
  });
});

/** GET /api/templates/new
Generate blank template. */
R.get(/^\/api\/templates\/new$/, function(req, res, m) {
  res.json({html: ''});
});

/** POST /api/templates
Create new template. */
R.post(/^\/api\/templates$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Template.columns);
    models.Template.insert(fields, function(err, template) {
      if (err) {
        if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
          // 303 is a "See other" and SHOULD include a Location header
          return res.status(303).die('Template already exists');
        }
        return res.die(err);
      }
      res.status(201).json(template);
    });
  });
});

/** GET /api/templates/:id
Show existing template. */
R.get(/^\/api\/templates\/(\d+)$/, function(req, res, m) {
  models.Template.one({id: m[1]}, function(err, template) {
    if (err) return res.die(err);
    res.json(template);
  });
});

/** POST /api/templates/:id
Update existing template. */
R.post(/^\/api\/templates\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, models.Template.columns);

    db.Update('templates')
    .set(fields)
    .where('id = ?', m[1])
    .execute(function(err, rows) {
      if (err) return res.die(err);
      res.status(204).end(); // 204 No Content
    });
  });
});

/** DELETE /api/templates/:id
Delete existing template. */
R.delete(/^\/api\/templates\/(\d+)$/, function(req, res, m) {
  models.Template.delete({id: m[1]}, function(err) {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

module.exports = R.route.bind(R);
