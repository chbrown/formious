/*jslint node: true */
var _ = require('underscore');
var amulet = require('amulet');
var stream = require('stream');
var async = require('async');
var handlebars = require('handlebars');
var logger = require('loge');
var Router = require('regex-router');
var sv = require('sv');
var url = require('url');

var db = require('../db');
var flat = require('../lib/flat');
var models = require('../models');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** the Amazon Mechanical Turk frame will give us the following variables:

  https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
     &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
     &hitId=123RVWYBAZW00EXAMPLE
     &turkSubmitTo=https://www.mturk.com
     &workerId=AZ3456EXAMPLE
*/

/** GET /experiments/:experiment_id
Redirect to first stim of experiment
*/
R.get(/^\/experiments\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];

  db.Select('stims')
  .where('experiment_id = ?', experiment_id)
  .orderBy('view_order')
  .limit(1)
  .execute(function(err, stims) {
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
      models.Experiment.one({id: experiment_id}, callback);
    },
    stim: function(callback) {
      models.Stim.one({id: stim_id}, callback);
    },
    template: ['stim', function(callback, results) {
      models.Template.one({id: results.stim.template_id}, callback);
    }],
  }, function(err, results) {
    if (err) return res.die(err);

    // stim_globals is given to all stims, in case they want the values.
    // it's mostly metadata, compared to the states.
    var urlObj = url.parse(req.url, true);

    // context: the current state to render the template with
    // urlObj.query will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
    var context = _.extend(results.stim.context, urlObj.query, {
      experiment_id: experiment_id,
      stim_id: stim_id,
    });
    var deep_context = flat.unflatten(context);

    // need a better default for missing html
    var template_html = results.template.html;
    var rendered_html = template_html;
    try {
      rendered_html = handlebars.compile(template_html)(deep_context);
    }
    catch (exc) {
      logger.error('Error compiling template markup', exc);
    }
    var ctx = {
      context: context,
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
    // logger.debug('Inserting response', {aws_worker_id: aws_worker_id, data: data});

    var ready = function(err) {
      if (err) return res.die(err);

      models.Stim.nextStimId(experiment_id, stim_id, function(err, next_stim_id) {
        if (err) return res.die(err);

        // http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
        // sadly, this redirect_to doesn't work. Hopefully the user will have a proper
        // POST-to-MT form in their last stim
        var redirect_to = urlObj.query.turkSubmitTo + '/mturk/externalSubmit?assignmentId=' + urlObj.query.assignmentId;
        if (next_stim_id) {
          // only change the path part of the url
          urlObj.pathname = '/experiments/' + experiment_id + '/stims/' + next_stim_id;
          redirect_to = url.format(urlObj);
        }

        var ajax = req.headers['x-requested-with'] == 'XMLHttpRequest';
        if (ajax) {
          res.setHeader('Location', redirect_to);
          res.end();
        }
        else {
          // ['admin/layout.mu', 'admin/experiments/stims/all.mu'];
          // res.json({message: 'Inserted response.'});
          res.redirect(redirect_to);
        }
      });
    };

    if (data) {
      models.Participant.addResponse({
        aws_worker_id: aws_worker_id,
        ip_address: req.headers['x-real-ip'] || req.client.remoteAddress,
        user_agent: req.headers['user-agent'],
      }, {
        stim_id: stim_id,
        value: data,
      }, ready);
    }
    else {
      ready();
    }
  });
});

/** GET /experiments/:experiment_id/responses?token=ABCDEF12345
Requires authorization! Show only the responses that reference this Experiment. */
R.get(/^\/experiments\/(\d+)\/responses(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];

  var urlObj = url.parse(req.url, true);
  models.AccessToken.check(urlObj.query.token, 'experiments', experiment_id, function(err, access_token) {
    if (err) return res.die(err);

    // authorization granted
    async.auto({
      experiment: function(callback) {
        models.Experiment.one({id: experiment_id}, callback);
      },
      responses: function(callback) {
        var from_clause = [
          'responses',
          'INNER JOIN stims ON stims.id = responses.stim_id',
          'INNER JOIN participants ON participants.id = responses.participant_id',
        ].join(' ');

        db.Select(from_clause)
        .add('responses.*', 'stims.context', 'stims.experiment_id', 'participants.name', 'participants.aws_worker_id')
        .where('stims.experiment_id = ?', experiment_id)
        .orderBy('responses.id DESC')
        .execute(callback);
      },
    }, function(err, results) {
      if (err) return res.die(err);
      // results.experiment.name

      // var stringifier = new Tabulator({peek: 100});
      // res.setHeader('Content-Type', 'text/html');
      // res.write('<style>' +
      //   'body { font-size: 80%; } ' +
      //   'table { border-collapse: collapse; } ' +
      //   'table td { border: 1px solid #ccc; } ' +
      // '</style>');
      var stringifier = new sv.Stringifier({peek: 100});
      // res.setHeader('Content-Type', 'text/csv');
      stringifier.pipe(res);
      results.responses.forEach(function(response) {
        var row = {
          response_id: response.id,
          participant_id: response.participant_id,
          participant_name: response.name || response.aws_worker_id,
          experiment_id: response.experiment_id,
          stim_id: response.stim_id,
          created: response.created,
        };
        // merge those static values with the dynamic context and value objects
        _.extend(row, response.context, response.value);

        stringifier.write(row);
      });
      stringifier.end();
      // amulet.stream(['responses/all.mu'], results).pipe(res);
    });
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

module.exports = R.route.bind(R);
