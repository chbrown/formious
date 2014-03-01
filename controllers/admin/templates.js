/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var logger = require('loge');
var Router = require('regex-router');
var sqlcmd = require('sqlcmd');

var db = require('../../lib/db');
var models = require('../../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/templates
Index: show all templates */
R.get(/^\/admin\/templates(\/|.json)?$/, function(req, res, m) {
  new sqlcmd.Select({table: 'templates'})
  .orderBy('id')
  .execute(db, function(err, templates) {
    if (err) return res.die(err);

    req.ctx.templates = templates;

    req.ctx.templates_json = JSON.stringify(templates).replace(/<\//g, '<\\/');
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/templates/all.mu']);
  });
});


/** GET /admin/templates/new
New: edit blank template */
R.get(/^\/admin\/templates\/new$/, function(req, res, m) {
  req.ctx.template = {};
  req.ctx.template_json = '{}';
  amulet.stream(['admin/layout.mu', 'admin/templates/one.mu'], req.ctx).pipe(res);
});

/** POST /admin/templates
Create: insert new template */
R.post(/^\/admin\/templates\/?$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, 'name', 'html', 'created');

    new sqlcmd.Insert({table: 'templates'})
    .setIf(fields)
    .execute(db, function(err, rows) {
      if (err) return res.die(err);

      res.json(rows[0]);
    });
  });
});

/** GET /admin/templates/:id
Show: (and edit) existing template */
R.get(/^\/admin\/templates\/(\d+)(.json)?$/, function(req, res, m) {
  models.Template.from({id: m[1]}, function(err, template) {
    if (err) return res.die(err);

    req.ctx.template = template;
    req.ctx.template_json = JSON.stringify(template).replace(/<\//g, '<\\/');
    res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/templates/one.mu']);
  });
});

/** GET /admin/templates/:id/render
Render existing template as html */
R.get(/^\/admin\/templates\/(\d+)\/render$/, function(req, res, m) {
  models.Template.from({id: m[1]}, function(err, template) {
    if (err) return res.die(err);

    res.html(template.html);
  });
});


// * GET /admin/templates/:id/clone
// create new StimTemplate as clone of other
// R.get(/^\/admin\/templates\/(\d+)\/clone$/, function(req, res, m) {
//   var _id = m[1];
//   models.StimTemplate.findById(_id, function(err, stim_template) {
//     if (err) return res.die('StimTemplate.findById() error', err);
//     if (!stim_template) return res.die('No StimTemplate "' + _id + '" could be found');

//     // copy properties, drop _id so new one will get inserted, and change name
//     var clone_properties = stim_template.toObject();
//     clone_properties._id += '_copy';

//     models.StimTemplate.create(clone_properties, function(err, stim_template) {
//       if (err) return res.die('StimTemplate.create error: ' + err);

//       res.redirect('/admin/templates/' + stim_template._id + '/edit');
//     });
//   });
// });

/** PATCH /admin/templates/:id
Update: modify existing template */
R.patch(/^\/admin\/templates\/(\d+)/, function(req, res, m) {
  models.Template.from({id: m[1]}, function(err, template) {
    if (err) return res.die(err);

    req.readData(function(err, data) {
      if (err) return res.die(err);

      var fields = _.pick(data, 'name', 'html', 'created');

      new sqlcmd.Update({table: 'templates'})
      .setIf(fields)
      .where('id = ?', template.id)
      .execute(db, function(err, rows) {
        if (err) return res.die(err);

        res.json(_.extend(template, fields));
      });
    });
  });
});

/** DELETE /admin/templates/:id
Delete: delete existing template */
R.delete(/^\/admin\/templates\/(\d+)$/, function(req, res, m) {
  var template_id = m[1];
  new sqlcmd.Delete({table: 'templates'}).where('id = ?', template_id)
  .execute(db, function(err, result) {
    if (err) return res.die(err);

    res.json({message: 'Deleted template: ' + m[1]});
  });
});

module.exports = R.route.bind(R);
