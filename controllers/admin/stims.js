'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var amulet = require('amulet');
var Router = require('regex-router');

// i.e., StimTemplates, not really just stims (which are under stimlists/...)

var logger = require('../../lib/logger');
var misc = require('../../lib/misc');
var models = require('../../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/stims/new
create new StimTemplate and redirect to edit it */
R.get(/^\/admin\/stims\/new/, function(req, res, m) {
  new models.StimTemplate().save(function(err, stim_template) {
    if (err) return res.die('New StimTemplate save error: ' + err);

    res.redirect('/admin/stims/' + stim_template._id + '/edit');
  });
});

/** GET /admin/stims/:stim_id/clone
create new StimTemplate as clone of other */
R.get(/^\/admin\/stims\/(\w+)\/clone$/, function(req, res, m) {
  var _id = m[1];
  models.StimTemplate.findById(_id, function(err, stim_template) {
    if (err) return res.die('StimTemplate.findById() error', err);
    if (!stim_template) return res.die('No StimTemplate "' + _id + '" could be found');

    // copy properties, drop _id so new one will get inserted, and change name
    var properties = stim_template.toObject();
    delete properties._id;
    properties.name += ' (copy)';

    new models.StimTemplate(properties).save(function(err, stim_template) {
      if (err) return res.die('New StimTemplate save error: ' + err);

      res.redirect('/admin/stims/' + stim_template._id + '/edit');
    });
  });
});

/** GET /admin/stims/:stim_id/edit
edit existing StimTemplate */
R.get(/^\/admin\/stims\/(\w+)\/edit$/, function(req, res, m) {
  var _id = m[1];
  models.StimTemplate.findById(_id, function(err, stim_template) {
    if (err) return res.die('StimTemplate.findById() error', err);
    if (!stim_template) return res.die('No StimTemplate "' + _id + '" could be found');

    var stim_template_json = stim_template.toJSON();
    // stim_template_json.html = misc.escapeHTML(stim_template_json.html);
    req.ctx.stim = stim_template_json;

    amulet.stream(['admin/layout.mu', 'admin/stims/edit.mu'], req.ctx).pipe(res);
  });
});

/** PATCH /admin/stims/:stim_id
update existing StimTemplate */
R.patch(/^\/admin\/stims\/(\w+)/, function(req, res, m) {
  var _id = m[1];
  req.readToEnd('utf8', function(err, stim_template_json) {
    if (err) return res.die('req.readToEnd error: ' + err);

    var fields = misc.parseJSON(stim_template_json);
    if (fields instanceof Error) return res.die('Could not parse JSON. Error: ' + fields);

    models.StimTemplate.findById(_id, function(err, stim) {
      if (err) return res.die('StimTemplate.findById error: ' + err);

      _.extend(stim, fields);
      stim.save(function() {
        res.json(stim);
      });
    });
  });
});

/** DELETE /admin/stims/:stim_id
delete StimTemplate */
R.delete(/^\/admin\/stims\/(\w+)$/, function(req, res, m) {
  var _id = m[1];
  models.StimTemplate.findByIdAndRemove(_id, function(err, stim) {
    if (err) return res.die('StimTemplate.findByIdAndRemove error: ' + err);

    res.json({success: true, message: 'Deleted stim: ' + _id});
  });
});

/** GET /admin/stims
list all StimTemplates */
R.get(/^\/admin\/stims\/?$/, function(req, res, m) {
  models.StimTemplate.find({}, function(err, stims) {
    if (err) return res.die('StimTemplate.find() error', err);

    req.ctx.stims = stims;
    amulet.stream(['admin/layout.mu', 'admin/stims/all.mu'], req.ctx).pipe(res);
  });
});

module.exports = R.route.bind(R);
