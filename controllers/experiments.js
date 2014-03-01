/*jslint node: true */
var _ = require('underscore');
var url = require('url');
var amulet = require('amulet');
var Router = require('regex-router');
var logger = require('loge');
var sqlcmd = require('sqlcmd');

var db = require('../lib/db');
var models = require('../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /experiments/:experiment_id
Redirect to first stim of experiment
*/
R.get(/^\/experiments\/(\d+)(\?|$)/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);
  var experiment_id = m[1];

  new sqlcmd.Select({table: 'stims'})
  .where('experiment_id = ?', experiment_id)
  .orderBy('view_order')
  .limit(1)
  .execute(db, function(err, stims) {
    if (err) return res.die(err);

    urlObj.pathname = '/experiments/' + experiment_id + '/stims/' + stims[0].id;
    var stim_url = url.format(urlObj);

    res.redirect(stim_url);
  });
});

/** GET /experiments/:experiment_id/stims/:stim_id
Render stim as html
*/
R.get(/^\/experiments\/(\d+)\/stims\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];
  var stim_id = m[2];
  // models.Experiment.from({id: m[1]}, function(err, experiment) { ... });
  models.Stim.from({id: stim_id}, function(err, stim) {
    if (err) return res.die(err);
    models.Template.from({id: stim.template_id}, function(err, template) {
      if (err) return res.die(err);

      var ctx = {
        context: stim.context,
        stim_id: stim.id,
        html: template.html,
      };

      // stim_globals is given to all stims, in case they want the values. it's mostly metadata, compared to the states.
      // var stim_globals = {
      //   assignmentId: '{{assignmentId}}',
      //   hit_started: {{hit_started}},
      //   hitId: '{{hitId}}',
      //   host: '{{host}}',
      //   workerId: '{{workerId}}',
      //   stimlist: '{{stimlist_id}}'
      // };
      // ctx: the current state to render the template with
      // var ctx = {
      //   // straight from the url
      //   host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
      //   workerId: user._id,
      //   assignmentId: urlObj.query.assignmentId,
      //   hitId: urlObj.query.hitId,
      //   segment: urlObj.query.segment,
      //   index: urlObj.query.index || 0,
      //   // specific to this type of responses (stimlists)
      //   hit_started: Date.now(),
      //   stimlist_id: stimlist._id,
      // };

      amulet.stream(['experiments/stims/one.mu'], ctx).pipe(res);
    });
  });
});

var nextStimId = function(experiment_id, stim_id, callback) {
  // callback(err, next_stim_id)
  // or
  // callback(null, null) if there are no more stims
  models.Stim.from({id: stim_id}, function(err, stim) {
    if (err) return callback(err);

    new sqlcmd.Select({table: 'stims'})
    .where('view_order > ?', stim.view_order)
    .orderBy('view_order')
    .limit(1)
    .execute(db, function(err, stims) {
      if (err) return callback(err);

      callback(null, stims.length ? stims[0].id : null);
    });
  });
};

/** POST /experiments/:experiment_id/stims/:stim_id
Save response
*/
R.post(/^\/experiments\/(\d+)\/stims\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];
  var stim_id = m[2];

  req.readData(function(err, data) {
    if (err) return res.die(err);

    logger.debug('Inserting response.', {aws_worker_id: req.aws_worker_id, data: data});

    models.Participant.addResponse(req.aws_worker_id, stim_id, data, function(err, responses) {
      if (err) return res.die(err);

      // res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/experiments/stims/all.mu']);
      nextStimId(experiment_id, stim_id, function(err, next_stim_id) {
        var next_stim_url = '/experiments/' + experiment_id + '/stims/' + next_stim_id;
        res.redirect(next_stim_url);
      });
      // res.json({message: 'Inserted response.'});
      // res.json({success: true, message: 'Saved response for user: ' + workerId});
      // amulet.stream(['layout.mu', 'done.mu'], {}).pipe(res);
    });
  });
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

// TODO: fix segmentation
//   starting at given index or 0, of the next available segment.
//   GET /experiments/:experiment_id
//   ?segment=:segment&index=:index
// segmentation:
// if (stimlist.segmented && ctx.segment === undefined) {
//   // url.format ignores .query if there is also .search, and url.parse gives us both (unfortunately)
//   var new_urlObj = {pathname: urlObj.pathname, query: urlObj.query};

//   // find next available segment
//   var segments_available = _.difference(stimlist.segments, stimlist.segments_claimed);
//   if (segments_available.length === 0) {
//     // simple warning, in case we're keeping track:
//     logger.warn('No more unclaimed segments for stimlist, "%s"', stimlist._id);
//   }

//   // if there are any unclaimed segments, or if this is a MT preview:
//   if (segments_available.length === 0 || preview_mode) {
//     var random_index = Math.random()*stimlist.segments.length | 0;
//     var random_segment = stimlist.segments[random_index];
//     logger.info('Assigning stimlist randomly: "%s"', random_segment);

//     new_urlObj.query.segment = random_segment;
//     res.redirect(url.format(new_urlObj));
//   }
//   else {
//     var next_segment = segments_available[0];
//     stimlist.update({$push: {segments_claimed: next_segment}}, function(err) {
//       if (err) return res.die('Could not claim segment: ' + err);

//       new_urlObj.query.segment = next_segment;
//       res.redirect(url.format(new_urlObj));
//     });
//   }
// }
// if (stimlist.segmented) {
//   states = states.filter(function(state) {
//     return state.segment == ctx.segment;
//   });
// }

module.exports = function(req, res) {
  // this is where we need the workerId cookie (aws_worker_id value)
  req.aws_worker_id = req.cookies.get('workerId');
  if (!req.aws_worker_id) {
    // if the cookie has not yet been set, set it from the url
    var urlObj = url.parse(req.url, true);
    req.aws_worker_id = urlObj.query.workerId;
    req.cookies.set('workerId', req.aws_worker_id);
  }

  // req.aws_worker_id is now available
  R.route(req, res);
};

