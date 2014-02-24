/*jslint node: true */
var _ = require('underscore');
var url = require('url');
var amulet = require('amulet');
var Router = require('regex-router');
var logger = require('loge');

var models = require('../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

// this is a little weird, for now
// R.get(/^\/templates\/stims\/([^?]+\.bars)(\?|$)/, function(req, res, m) {
//   // only handles .bars, at the moment
//   logger.debug('/templates/stims: %s', m[1]);
//   // check if there is a StimTemplate, first
//   var _id = m[1].replace(/\.bars$/, '');
//   models.StimTemplate.findById(_id, function(err, stim_template) {
//     if (err) return res.die('StimTemplate.findById error: ' + err);

//     if (stim_template) {
//       logger.debug('found StimTemplate:', stim_template._id);

//       res.writeAll(200, 'text/x-handlebars-template', stim_template.html);
//     }
//     else {
//       // else we hope that there's a static file
//       logger.debug('send: %s', m[1]);
//       res.setHeader('Content-Type', 'text/x-handlebars-template');
//       send(req, m[1])
//         .root(path.join(__dirname, '..', 'templates', 'stims'))
//         // .on('file', function(path, stat) {})
//         .on('error', function(err) { res.die(err.status || 500, 'send error: ' + err.message); })
//         .on('directory', function() { res.die(404, 'No resource at: ' + req.url); })
//         .pipe(res);
//     }
//   });
// });

/** GET /experiments/:experiment_id
    GET /experiments/:experiment_id
    //?segment=:segment&index=:index
Present single stimlist (given by name, not id) to worker,
starting at given index or 0, of the next available segment.
*/
R.get(/^\/experiments\/(\w+)(\?|$)/, function(req, res, m) {
  var _id = m[1];
  var urlObj = url.parse(req.url, true);
  var workerId = urlObj.query.workerId || req.user_id;

  models.User.from({name: workerId}, function(err, user) {
    if (err) return res.die('User query error: ' + err);
    if (!user) return res.die('Could not find user: ' + workerId);

    // update cookie if needed
    if (req.cookies.get('workerId') != user._id) req.cookies.set('workerId', user._id);

    models.Stimlist.findById(_id, function(err, stimlist) {
      if (err) return res.die('Stimlist.findById error: ' + err);
      if (!stimlist) return res.die('Could not find Stimlist: ' + _id);

      // ctx: the current state to render the template with
      var ctx = {
        // straight from the url
        host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
        workerId: user._id,
        assignmentId: urlObj.query.assignmentId,
        hitId: urlObj.query.hitId,
        segment: urlObj.query.segment,
        index: urlObj.query.index || 0,
        // specific to this type of responses (stimlists)
        hit_started: Date.now(),
        stimlist_id: stimlist._id,
      };

      var preview_mode = ctx.assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE';

      if (stimlist.segmented && ctx.segment === undefined) {
        // url.format ignores .query if there is also .search, and url.parse gives us both (unfortunately)
        var new_urlObj = {pathname: urlObj.pathname, query: urlObj.query};

        // find next available segment
        var segments_available = _.difference(stimlist.segments, stimlist.segments_claimed);
        if (segments_available.length === 0) {
          // simple warning, in case we're keeping track:
          logger.warn('No more unclaimed segments for stimlist, "%s"', stimlist._id);
        }

        // if there are any unclaimed segments, or if this is a MT preview:
        if (segments_available.length === 0 || preview_mode) {
          var random_index = Math.random()*stimlist.segments.length | 0;
          var random_segment = stimlist.segments[random_index];
          logger.info('Assigning stimlist randomly: "%s"', random_segment);

          new_urlObj.query.segment = random_segment;
          res.redirect(url.format(new_urlObj));
        }
        else {
          var next_segment = segments_available[0];
          stimlist.update({$push: {segments_claimed: next_segment}}, function(err) {
            if (err) return res.die('Could not claim segment: ' + err);

            new_urlObj.query.segment = next_segment;
            res.redirect(url.format(new_urlObj));
          });
        }
      }
      else {
        var states = stimlist.states;

        if (stimlist.segmented) {
          states = states.filter(function(state) {
            return state.segment == ctx.segment;
          });
        }

        if (stimlist.default_stim) {
          logger.debug('Setting default stim to %s', stimlist.default_stim);
          states.forEach(function(state) {
            if (!state.stim) state.stim = stimlist.default_stim;
          });
        }

        if (stimlist.pre_stim && !preview_mode) {
          // presumably, this is the consent form, which we don't want to show if we're in preview mode
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
