'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('../../lib/logger');
var misc = require('../../lib/misc');
var models = require('../../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /admin/stimlists
list all Stimlists */
R.get(/^\/admin\/stimlists\/?$/, function(req, res, m) {
  models.Stimlist.find({}, '_id created creator csv.length states.length', function(err, stimlists) {
    if (err) return res.die('Stimlist.find() error', err);

    req.ctx.stimlists = stimlists;
    amulet.stream(['admin/layout.mu', 'admin/stimlists/all.mu'], req.ctx).pipe(res);
  });
});

/** GET /admin/stimlists/new
create new Stimlist and redirect to edit it */
R.get(/^\/admin\/stimlists\/new/, function(req, res, m) {
  models.Stimlist.create({creator: req.user._id}, function(err, stimlist) {
    if (err) return res.die('Stimlist.create error: ' + err);

    res.redirect('/admin/stimlists/' + stimlist._id + '/edit');
  });
});

/** GET /admin/stimlists/:stimlist_id/edit
edit existing Stimlist */
R.get(/^\/admin\/stimlists\/(\w+)\/edit$/, function(req, res, m) {
  var stimlist_id = m[1];
  models.Stimlist.findById(stimlist_id, function(err, stimlist) {
    if (err) return res.die('Stimlist.findById() error', err);
    if (!stimlist) return res.die('No stimlist "' + stimlist_id + '" could be found');

    // set the context to match the normal GET /admin/stimlists/:stimlist
    _.extend(req.ctx, {
      hit_started: Date.now(),
      index: 0,
      stimlist: stimlist,
    });
    amulet.stream(['admin/layout.mu', 'admin/stimlists/edit.mu'], req.ctx).pipe(res);
  });
});

/** PATCH /admin/stimlists/:stimlist_id
update existing Stimlist */
R.patch(/^\/admin\/stimlists\/(\w+)/, function(req, res, m) {
  var _id = m[1];
  models.Stimlist.findById(_id, function(err, stimlist) {
    if (err) return res.die('Stimlist.findById error: ' + err);
    if (!stimlist) return res.die(404, 'Could not find Stimlist: ' + _id);

    req.readToEnd('utf8', function(err, stimlist_json) {
      if (err) return res.die('req.readToEnd error: ' + err);

      var fields = {};
      try {
        fields = JSON.parse(stimlist_json);
      }
      catch (exc) {
        return res.die('Could not parse JSON. Error: ' + exc);
      }

      stimlist.extendSave(fields, function(err, stimlist) {
        if (err) return res.die('Stimlist.save error: ' + err);

        if (stimlist._id != _id) {
          // ask for redirect if the _id changed
          res.setHeader('location', '/admin/stimlists/' + stimlist._id + '/edit');
        }

        // not sure how I feel about this special header business
        res.setHeader('x-message', 'Stimlist saved: ' + stimlist._id);
        res.json(stimlist);
      });
    });
  });
});

/** DELETE /admin/stimlists/:stimlist_id
delete Stimlist */
R.delete(/^\/admin\/stimlists\/(\w+)$/, function(req, res, m) {
  var _id = m[1];
  models.Stimlist.findByIdAndRemove(_id, function(err, stimlist) {
    if (err) return res.die('Stimlist.findByIdAndRemove error: ' + err);

    res.json({success: true, message: 'Deleted stimlist: ' + _id});
  });
});

module.exports = R.route.bind(R);
