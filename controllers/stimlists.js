'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var url = require('url');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('../lib/logger');
var misc = require('../lib/misc');
var models = require('../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /stimlists/:slug
or  GET /stimlists/:slug/:index
Present single stimlist (given by name, not id) to worker, starting at given index or 0
*/
R.get(/^\/stimlists\/(\w+)(\/(\d+))?/, function(req, res, m) {
  var slug = m[1];
  var index = m[3] || 0;

  var urlObj = url.parse(req.url, true);
  var workerId = urlObj.query.workerId || req.user_id;
  models.User.fromId(workerId, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die('Could not find user: ' + workerId);

    req.cookies.set('workerId', user._id);

    models.Stimlist.findOne({slug: slug}, function(err, stimlist) {
      if (err) return res.die('Could not find stimlist "' + slug + '": ' + err);

      var ctx = {
        assignmentId: urlObj.query.assignmentId,
        hit_started: Date.now(),
        hitId: urlObj.query.hitId,
        host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
        index: index,
        stimlist: stimlist,
        workerId: user._id,
      };
      amulet.stream(['layout.mu', 'stimlists/one.mu'], ctx).pipe(res);
    });
  });
});

module.exports = R.route.bind(R);
