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
create new Stim and redirect to edit it */
R.get(/^\/admin\/stims\/new/, function(req, res, m) {
  new models.StimTemplate().save(function(err, stim) {
    if (err) return res.die('New Stim save error: ' + err);

    res.redirect('/admin/stims/' + stim._id + '/edit');
  });
});

/** GET /admin/stims/:stim_id/edit
edit existing Stim */
R.get(/^\/admin\/stims\/(\w+)\/edit$/, function(req, res, m) {
  var stim_id = m[1];
  models.StimTemplate.findById(stim_id, function(err, stim) {
    if (err) return res.die('Stim.findById() error', err);
    if (!stim) return res.die('No stim "' + stim_id + '" could be found');

    var stim_json = stim.toJSON();
    stim_json.html = misc.escapeHTML(stim_json.html);
    req.ctx.stim = stim_json;

    amulet.stream(['admin/layout.mu', 'admin/stims/edit.mu'], req.ctx).pipe(res);
  });
});

/** PATCH /admin/stims/:stim_id
update existing Stim */
R.patch(/^\/admin\/stims\/(\w+)/, function(req, res, m) {
  var stim_id = m[1];
  req.readToEnd('utf8', function(err, stim_json) {
    if (err) return res.die('req.readToEnd error: ' + err);

    var fields = misc.parseJSON(stim_json);
    if (fields instanceof Error) return res.die('Could not parse JSON. Error: ' + fields);

    models.StimTemplate.findById(stim_id, function(err, stim) {
      if (err) return res.die('Stim.findById error: ' + err);

      _.extend(stim, fields);
      stim.save(function() {
        res.json(stim);
      });
    });
  });
});

/** DELETE /admin/stims/:stim_id
delete Stim */
R.delete(/^\/admin\/stims\/(\w+)$/, function(req, res, m) {
  var stim_id = m[1];
  models.StimTemplate.findByIdAndRemove(stim_id, function(err, stim) {
    if (err) return res.die('Stim.findByIdAndRemove error: ' + err);

    res.json({success: true, message: 'Deleted stim: ' + m[1]});
  });
});

/** GET /admin/stims
list all Stims */
R.get(/^\/admin\/stims\/?$/, function(req, res, m) {
  models.StimTemplate.find({}, function(err, stims) {
    if (err) return res.die('Stim.find() error', err);

    req.ctx.stims = stims;
    amulet.stream(['admin/layout.mu', 'admin/stims/all.mu'], req.ctx).pipe(res);
  });
});

module.exports = R.route.bind(R);
