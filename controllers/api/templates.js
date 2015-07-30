var _ = require('lodash');
var Router = require('regex-router');
var db = require('../../db');

var R = new Router();

var templates_columns = ['name', 'html'];

/** GET /api/templates
List all templates. */
R.get(/^\/api\/templates$/, function(req, res) {
  db.Select('templates')
  .orderBy('id ASC')
  .execute(function(err, templates) {
    if (err) return res.die(err);
    res.json(templates);
  });
});

/** GET /api/templates/new
Generate blank template. */
R.get(/^\/api\/templates\/new$/, function(req, res) {
  res.json({html: '', created: new Date()});
});

/** POST /api/templates
Create new template. */
R.post(/^\/api\/templates$/, function(req, res) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, templates_columns);

    db.InsertOne('templates')
    .set(fields)
    .returning('*')
    .execute(function(err, template) {
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
  db.SelectOne('templates')
  .whereEqual({id: m[1]})
  .execute(function(err, template) {
    if (err) return res.die(err);
    res.setHeader('Cache-Control', 'max-age=5');
    res.json(template);
  });
});

/** POST /api/templates/:id
Update existing template. */
R.post(/^\/api\/templates\/(\d+)/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, templates_columns);

    db.Update('templates')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .execute(function(err) {
      if (err) return res.die(err);
      res.status(204).end(); // 204 No Content
    });
  });
});

/** DELETE /api/templates/:id
Delete existing template. */
R.delete(/^\/api\/templates\/(\d+)$/, function(req, res, m) {
  db.Delete('templates')
  .whereEqual({id: m[1]})
  .execute(function(err) {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

module.exports = R.route.bind(R);
