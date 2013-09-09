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

/** GET /admin/stimlists/new
create new Stimlist and redirect to edit it */
R.get(/^\/admin\/stimlists\/new/, function(req, res, m) {
  new models.Stimlist({creator: req.user._id}).save(function(err, stimlist) {
    if (err) {
      logger.error('new Stimlist().save() error', err);
      return res.die(err);
    }

    res.redirect('/admin/stimlists/' + stimlist._id + '/edit');
  });
});

/** GET /admin/stimlists/:stimlist_id/edit
edit existing Stimlist */
R.get(/^\/admin\/stimlists\/(\w+)\/edit$/, function(req, res, m) {
  var stimlist_id = m[1];
  models.Stimlist.findById(stimlist_id, function(err, stimlist) {
    if (err) {
      logger.error('Stimlist.findById() error', err);
      return res.die(err);
    }

    if (!stimlist) {
      return res.die('No stimlist "' + stimlist_id + '" could be found');
    }

    // set the context to match the normal GET /admin/stimlists/:stimlist
    var ctx = {
      hit_started: Date.now(),
      index: 0,
      stimlist: stimlist,
      workerId: req.user._id,
    };
    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/stimlists/edit.mu'], ctx).pipe(res);
  });
});

/** PATCH /admin/stimlists/:stimlist_id
update existing Stimlist */
R.patch(/^\/admin\/stimlists\/(\w+)/, function(req, res, m) {
  var stimlist_id = m[1];
  req.readToEnd('utf8', function(err, stimlist_json) {
    if (err) {
      logger.error('req.readToEnd error', err);
      return res.json({success: false, message: err.toString()});
    }

    var fields = misc.parseJSON(stimlist_json);
    if (fields instanceof Error) {
      var fields_err = new Error('Could not parse stimlist. Error: ' + fields.toString());
      logger.error('parseJSON error', fields_err);
      res.json({success: false, message: fields_err.toString()});
    }

    models.Stimlist.findById(stimlist_id, function(err, stimlist) {
      if (err) {
        logger.error('Stimlist.findById(%s) error', stimlist_id, err);
        return res.json({success: false, message: err});
      }

      _.extend(stimlist, fields);
      stimlist.save(function() {
        res.json(stimlist);
      });
    });
  });
});

/** DELETE /admin/stimlists/:stimlist_id
delete Stimlist */
R.delete(/^\/admin\/stimlists\/(\w+)$/, function(req, res, m) {
  var stimlist_id = m[1];
  models.Stimlist.findByIdAndRemove(stimlist_id, function(err, stimlist) {
    if (err) {
      logger.error('Stimlist.findByIdAndRemove(%s) error', stimlist_id, err);
      return res.json({success: false, message: err});
    }

    res.json({success: true, message: 'Deleted stimlist: ' + m[1]});
  });
});

/** GET /admin/stimlists
list all Stimlists */
R.get(/^\/admin\/stimlists\/?$/, function(req, res, m) {
  models.Stimlist.find({}, '_id created creator slug csv.length states.length', function(err, stimlists) {
    if (err) {
      logger.error('Stimlist.find({}, ...) error', err);
      return res.die(err);
    }

    amulet.stream(['layout.mu', 'admin/layout.mu', 'admin/stimlists/all.mu'], {stimlists: stimlists}).pipe(res);
  });
});

module.exports = R.route.bind(R);
