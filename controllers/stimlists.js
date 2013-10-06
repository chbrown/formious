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
    GET /stimlists/:slug?segment=:segment&index=:index
Present single stimlist (given by name, not id) to worker,
starting at given index or 0, of the next available segment.
*/
R.get(/^\/stimlists\/(\w+)(\?|$)/, function(req, res, m) {
  var slug = m[1];
  var urlObj = url.parse(req.url, true);
  // logger.debug('stimlist: slug=%s, segment=%s, index=%s', slug, segment, index)
  var workerId = urlObj.query.workerId || req.user_id;

  models.User.fromId(workerId, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die('Could not find user: ' + workerId);

    // update cookie if needed
    if (req.cookies.get('workerId') != user._id) req.cookies.set('workerId', user._id);

    models.Stimlist.findOne({slug: slug}, function(err, stimlist) {
      if (err) return res.die('Could not find stimlist "' + slug + '": ' + err);

      var ctx = {
        assignmentId: urlObj.query.assignmentId,
        hit_started: Date.now(),
        hitId: urlObj.query.hitId,
        host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
        workerId: user._id,
        slug: stimlist.slug,
        index: urlObj.query.index || 0,
      };

      if (stimlist.segmented && urlObj.query.segment === undefined) {
        // find next available segment
        var segments_available = _.difference(stimlist.segments, stimlist.segments_claimed);
        if (segments_available.length === 0) {
          // previous harsh behavior:
          // res.die('No more available segments for stimlist: ' + slug);

          var random_index = Math.random()*stimlist.segments.length | 0;
          var random_segment = stimlist.segments[random_index];
          logger.warn('No more unclaimed segments for stimlist, "%s", assigning randomly and not claiming: "%s"', slug, random_segment);
          res.redirect('/stimlists/' + slug + '?segment=' + random_segment);
        }
        else {
          var next_segment = segments_available[0];
          stimlist.update({$push: {segments_claimed: next_segment}}, function(err) {
            if (err) return res.die('Could not claim segment:' + err);

            res.redirect('/stimlists/' + slug + '?segment=' + next_segment);
          });
        }
      }
      else {
        var states = stimlist.states;

        if (stimlist.segmented) {
          states = states.filter(function(state) {
            return state.segment == urlObj.query.segment;
          });
        }

        if (stimlist.default_stim) {
          logger.debug('Setting default stim to %s', stimlist.default_stim);
          states.forEach(function(state) {
            if (!state.stim) state.stim = stimlist.default_stim;
          });
        }

        if (stimlist.pre_stim) {
          states.unshift({stim: stimlist.pre_stim});
        }
        if (stimlist.post_stim) {
          states.push({stim: stimlist.post_stim});
        }

        ctx.states = states;

        amulet.stream(['layout.mu', 'stimlists/one.mu'], ctx).pipe(res);
      }
    });
  });
});

module.exports = R.route.bind(R);
