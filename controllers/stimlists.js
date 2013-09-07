'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var url = require('url');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('../lib/logger');
var misc = require('../lib/misc');
var models = require('../lib/models');

var R = new Router();

// /stimlists/:slug -> present single stimlist to worker, starting at 0
// /stimlists/:slug/:index -> present stimlist, starting at given index
//   slugs must be word characters
R.get(/^\/stimlists\/(\w+)(\/(\d+))?/, function(m, req, res) {
  var stimlist_slug = m[1];

  var urlObj = url.parse(req.url, true);
  var workerId = urlObj.query.workerId || req.user_id;
  models.User.fromId(workerId, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die('Could not find user: ' + workerId);

    req.cookies.set('workerId', user._id);

    models.Stimlist.findOne({slug: stimlist_slug}, function(err, stimlist) {
      if (err) {
        logger.error('Stimlist.findOne(slug=%s) error', stimlist_slug, err);
        return res.die(err);
      }

      var ctx = {
        assignmentId: urlObj.query.assignmentId,
        hit_started: Date.now(),
        hitId: urlObj.query.hitId,
        host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
        index: m[3] || 0,
        stimlist: stimlist,
        workerId: user._id,
      };
      amulet.stream(['layout.mu', 'stimlists/one.mu'], ctx).pipe(res);
    });
  });
});

R.default = function(m, req, res) {
  res.die(404, 'No resource at: ' + req.url);
};

module.exports = function(m, req, res) { R.route(req, res); };
