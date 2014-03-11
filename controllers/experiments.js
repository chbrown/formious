/*jslint node: true */
var _ = require('underscore');
var url = require('url');
var amulet = require('amulet');
var async = require('async');
var handlebars = require('handlebars');
var Router = require('regex-router');
var logger = require('loge');
var sqlcmd = require('sqlcmd');

var db = require('../lib/db');
var flat = require('../lib/flat');
var models = require('../lib/models');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** GET /experiments/:experiment_id
Redirect to first stim of experiment
*/
R.get(/^\/experiments\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];

  new sqlcmd.Select({table: 'stims'})
  .where('experiment_id = ?', experiment_id)
  .orderBy('view_order')
  .limit(1)
  .execute(db, function(err, stims) {
    if (err) return res.die(err);
    if (stims.length === 0) return res.die('No available stims');

    var urlObj = url.parse(req.url, true);
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

  async.auto({
    experiment: function(callback) {
      models.Experiment.from({id: m[1]}, callback);
    },
    stim: function(callback) {
      models.Stim.from({id: stim_id}, callback);
    },
    template: ['stim', function(callback, results) {
      models.Template.from({id: results.stim.template_id}, callback);
    }],
  }, function(err, results) {
    if (err) return res.die(err);

    // stim_globals is given to all stims, in case they want the values. it's mostly metadata, compared to the states.
    var urlObj = url.parse(req.url, true);

    // context: the current state to render the template with
    // urlObj.query will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
    var context = _.extend(results.stim.context, urlObj.query);
    var deep_context = flat.unflatten(context);

    // need a better default for missing html
    var template_html = results.template.html;
    var rendered_html = template_html ? handlebars.compile(template_html)(deep_context) : template_html;
    var ctx = {
      context: context,
      stim_id: results.stim.id,
      header: results.experiment.html,
      html: rendered_html,
    };

    amulet.stream(['experiments/stim.mu'], ctx).pipe(res);
  });
});

/** POST /experiments/:experiment_id/stims/:stim_id
Save response
*/
R.post(/^\/experiments\/(\d+)\/stims\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];
  var stim_id = m[2];
  var urlObj = url.parse(req.url, true);

  req.readData(function(err, data) {
    if (err) return res.die(err);

    var aws_worker_id = urlObj.query.workerId || 'WORKER_ID_NOT_AVAILABLE';
    logger.debug('Inserting response', {aws_worker_id: aws_worker_id, data: data});

    var ready = function(err) {
      if (err) return res.die(err);

      models.Stim.nextStimId(experiment_id, stim_id, function(err, next_stim_id) {
        if (err) return res.die(err);

        // http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
        var redirect_to = urlObj.query.turkSubmitTo + '/mturk/externalSubmit?assignmentId=' + urlObj.query.assignmentId;
        if (next_stim_id) {
          // only change the path part of the url
          urlObj.pathname = '/experiments/' + experiment_id + '/stims/' + next_stim_id;
          redirect_to = url.format(urlObj);
        }

        var ajax = req.headers['x-requested-with'] == 'XMLHttpRequest';
        if (ajax) {
          res.writeHead(300, {Location: redirect_to});
          res.end();
        }
        else {
          // res.adapt(req, req.ctx, ['admin/layout.mu', 'admin/experiments/stims/all.mu']);
          // res.json({message: 'Inserted response.'});
          res.redirect(redirect_to);
        }
      });
    };

    if (data) {
      models.Participant.addResponse(aws_worker_id, stim_id, data, ready);
    }
    else {
      ready();
    }
  });
});

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

// module.exports = R.route.bind(R);
module.exports = function(req, res) {
  // the Amazon Mechanical Turk frame will give us the following variables
  // https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
  //   &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
  //   &hitId=123RVWYBAZW00EXAMPLE
  //   &turkSubmitTo=https://www.mturk.com
  //   &workerId=AZ3456EXAMPLE

  // this is where we need the workerId cookie (aws_worker_id value)
  // req.aws_worker_id = req.cookies.get('workerId');
  // if (!req.aws_worker_id) {
    // if the cookie has not yet been set, set it from the url
  //   var urlObj = url.parse(req.url, true);
  //   req.aws_worker_id = urlObj.query.workerId;
  //   req.cookies.set('workerId', req.aws_worker_id);
  // }

  // req.aws_worker_id should now be set unless there was never any workerId to begin with
  R.route(req, res);
};
