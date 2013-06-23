'use strict'; /*jslint node: true, es5: true, indent: 2 */
var url = require('url');
var mechturk = require('mechturk');
var _ = require('underscore');
var amulet = require('amulet');
var misc = require('../misc');
var models = require('../models');
var logger = require('../logger');
var Router = require('regex-router');

var R = new Router();
var authR = new Router();

// GET /stimlists -> handle auth
module.exports = function(m, req, res) {
  var workerId = req.cookies.get('workerId');
  var ticket = req.cookies.get('ticket');
  models.User.withTicket(workerId, ticket, function(err, user) {
    logger.maybe(err);
    if (user && user.superuser) {
      req.user = user;
      authR.route(req, res);
    }
    else {
      R.route(req, res);
    }
  });
};

// GET /stimlists/new -> create new Stimlist and redirect to edit it
authR.get(/^\/stimlists\/new/, function(m, req, res) {
  var stimlist = new models.Stimlist({creator: req.user._id});
  stimlist.save(function(err) {
    logger.maybe(err);
    res.redirect('/stimlists/' + stimlist._id + '/edit');
  });
});

// GET /stimlists/:stimlist_id/edit -> edit existing Stimlist
authR.get(/^\/stimlists\/(\w+)\/edit/, function(m, req, res) {
  models.Stimlist.findById(m[1], function(err, stimlist) {
    logger.maybe(err);
    // set the context to match the normal GET /stimlists/:stimlist
    var ctx = {
      hit_started: Date.now(),
      index: 0,
      stimlist: stimlist,
      workerId: req.user._id,
    };
    amulet.stream(['layout.mu', 'stimlists/edit.mu'], ctx).pipe(res);
  });
});

// PATCH /stimlists/:stimlist_id
authR.patch(/^\/stimlists\/(\w+)/, function(m, req, res) {
  req.readToEnd('utf8', function(err, stimlist_json) {
    logger.maybe(err);
    var fields = misc.parseJSON(stimlist_json);
    if (fields instanceof Error) {
      var message = 'Could not parse stimlist. Error: ' + fields.toString();
      logger.error(message);
      res.json({success: false, message: message});
    }
    else {
      models.Stimlist.findById(m[1], function(err, stimlist) {
        logger.maybe(err);
        _.extend(stimlist, fields);
        stimlist.save();
        res.json(stimlist);
      });
    }
  });
});

// DELETE /stimlists/:stimlist_id
authR.delete(/^\/stimlists\/(\w+)/, function(m, req, res) {
  models.Stimlist.findByIdAndRemove(m[1], function(err, stimlist) {
    if (err) {
      logger.maybe(err);
      res.json({success: false, message: err.toString()});
    }
    else {
      res.json({success: true, message: 'Deleted stimlist: ' + m[1]});
    }
  });
});

// GET /stimlists -> index of all stimlists
authR.get(/^\/stimlists\/?$/, function(m, req, res) {
  models.Stimlist.find({}, '_id created creator slug csv.length states.length', function(err, stimlists) {
    logger.maybe(err);
    amulet.stream(['layout.mu', 'admin/layout.mu', 'stimlists/all.mu'], {stimlists: stimlists}).pipe(res);
  });
});

authR.default = function(m, req, res) {
  R.route(req, res);
};

// /stimlists index is forbidden unless you're logged in.
R.default = function(m, req, res) {
  res.die('No action there.');
};


// /stimlists/:slug -> present single stimlist to worker, starting at 0
// /stimlists/:slug/:index -> present stimlist, starting at given index
//  slugs must be word characters
R.get(/^\/stimlists\/(\w+)(\/(\d+))?/, function(m, req, res) {
  var slug = m[1];

  var urlObj = url.parse(req.url, true);
  var workerId = (urlObj.query.workerId || req.cookies.get('workerId') || '').replace(/\W+/g, '');
  req.cookies.set('workerId', workerId);

  models.User.fromId(workerId, function(err, user) {
    logger.maybe(err);
    models.Stimlist.findOne({slug: slug}, function(err, stimlist) {
      logger.maybe(err);
      var ctx = {
        assignmentId: urlObj.query.assignmentId,
        hit_started: Date.now(),
        hitId: urlObj.query.hitId,
        host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
        index: m[3] || 0,
        stimlist: stimlist,
        workerId: workerId,
      };
      amulet.stream(['layout.mu', 'stimlists/one.mu'], ctx).pipe(res);
    });
  });
});
