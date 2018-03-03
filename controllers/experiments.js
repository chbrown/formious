var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var async = require('async');
var handlebars = require('handlebars');
var {logger} = require('loge');
var Router = require('regex-router');
var url = require('url');

var adapt = require('../lib/adapt');
var db = require('../db');
var AccessToken = require('../models/AccessToken');
var Block = require('../models/Block');
var Participant = require('../models/Participant');

var _cached_block_template; // a Handlebars template function
function getBlockTemplate(callback) {
  if (_cached_block_template) {
    callback(null, _cached_block_template);
  }
  else {
    var block_template_filepath = path.join(__dirname, '..', 'public', 'block.html');
    fs.readFile(block_template_filepath, {encoding: 'utf8'}, function(err, block_template) {
      if (err) return callback(err);
      _cached_block_template = handlebars.compile(block_template);
      callback(null, _cached_block_template);
    });
  }
}

var R = new Router();

/** the Amazon Mechanical Turk frame will give us the following variables:

  https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
     &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
     &hitId=123RVWYBAZW00EXAMPLE
     &turkSubmitTo=https://www.mturk.com
     &workerId=AZ3456EXAMPLE
*/

/** GET /experiments/:experiment_id
Redirect to first block of experiment
*/
R.get(/^\/experiments\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];

  db.SelectOne('blocks')
  .where('experiment_id = ?', experiment_id)
  .orderBy('view_order ASC')
  .execute(function(err, block) {
    if (err) return res.die(err);
    if (!block) return res.die('No available blocks');

    var urlObj = url.parse(req.url, true);
    urlObj.pathname = '/experiments/' + experiment_id + '/blocks/' + block.id;
    var block_url = url.format(urlObj);

    res.redirect(block_url);
  });
});

/** GET /experiments/:experiment_id/blocks/:block_id
Render block as html
*/
R.get(/^\/experiments\/(\d+)\/blocks\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];
  var block_id = m[2];

  async.auto({
    experiment: function(callback) {
      db.SelectOne('experiments').whereEqual({id: experiment_id}).execute(callback);
    },
    block: function(callback) {
      db.SelectOne('blocks').whereEqual({id: block_id}).execute(callback);
    },
    template: ['block', function(callback, results) {
      db.SelectOne('templates').whereEqual({id: results.block.template_id}).execute(callback);
    }],
  }, function(err, results) {
    if (err) return res.die(err);

    // block_globals is given to all blocks, in case they want the values.
    // it's mostly metadata, compared to the states.
    var urlObj = url.parse(req.url, true);

    // context: the current state to render the template with
    // urlObj.query will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
    var context = _.extend(results.block.context || {}, urlObj.query, {
      experiment_id: experiment_id,
      block_id: block_id,
    });

    // need a better default for missing html
    var template_html = results.template.html;
    var rendered_html = template_html;
    try {
      rendered_html = handlebars.compile(template_html)(context);
    }
    catch (exc) {
      logger.error('Error compiling template markup', exc);
    }

    getBlockTemplate(function(err, block_template) {
      if (err) return res.die(err);

      var block_html = block_template({
        context: JSON.stringify(context).replace(/<\//g, '<\\/'),
        header: results.experiment.html,
        html: rendered_html,
      });
      res.html(block_html);
    });
  });
});

/** POST /experiments/:experiment_id/blocks/:block_id

Save response
*/
R.post(/^\/experiments\/(\d+)\/blocks\/(\d+)(\?|$)/, function(req, res, m) {
  var experiment_id = parseInt(m[1], 10);
  var block_id = parseInt(m[2], 10);
  var urlObj = url.parse(req.url, true);
  var aws_worker_id = urlObj.query.workerId || 'WORKER_ID_NOT_AVAILABLE';

  req.readData(function(err, data) {
    if (err) return res.die(err);

    Participant.addResponse({
      aws_worker_id: aws_worker_id,
      ip_address: req.headers['x-real-ip'] || req.client.remoteAddress,
      user_agent: req.headers['user-agent'],
    }, {
      block_id: block_id,
      value: data,
    }, function(err, participant /*, responses*/) {
      if (err) return res.die(err);

      Block.nextBlockId(experiment_id, block_id, participant.id, function(err, next_block_id) {
        if (err) return res.die(err);
        logger.info('Block.nextBlockId: %j', next_block_id);

        // http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
        // sadly, this redirect_to doesn't work. Hopefully the user will have a proper
        // POST-to-MT form in their last block
        // var redirect_to = urlObj.query.turkSubmitTo + '/mturk/externalSubmit?assignmentId=' + urlObj.query.assignmentId;
        if (next_block_id === null) {
          // meaning, there are no more blocks to complete
          return res.text('You have already completed all available blocks in this experiment.');
        }

        // only change the path part of the url
        urlObj.pathname = '/experiments/' + experiment_id + '/blocks/' + next_block_id;
        var redirect_to = url.format(urlObj);

        var ajax = req.headers['x-requested-with'] == 'XMLHttpRequest';
        if (ajax) {
          res.setHeader('Location', redirect_to);
          res.end();
        }
        else {
          res.redirect(redirect_to);
        }
      });
    });
  });
});

/** GET /experiments/:experiment_id/responses?token=ABCDEF12345

Requires authorization, but only by access token.
Show only the responses that reference this Experiment. */
R.get(/^\/experiments\/(\d+)\/responses(\?|$)/, function(req, res, m) {
  var experiment_id = m[1];

  var urlObj = url.parse(req.url, true);
  AccessToken.check(urlObj.query.token, 'experiments', experiment_id, function(err) {
    if (err) return res.die(err);

    // yay, authorization granted

    db.Select('responses, participants, blocks')
    .where('participants.id = responses.participant_id')
    .where('blocks.id = responses.block_id')
    .add('responses.*', 'blocks.context', 'blocks.experiment_id', 'participants.name', 'participants.aws_worker_id')
    .whereEqual({experiment_id: experiment_id})
    .orderBy('responses.id DESC')
    .execute(function(err, responses) {
      if (err) return res.die(err);

      var accept = urlObj.query.accept || req.headers.accept || 'application/json; boundary=LF';
      var writer = adapt.createTransform(accept);
      if (writer.content_type) {
        res.setHeader('Content-Type', writer.content_type);
      }
      writer.pipe(res);
      responses.forEach(function(response) {
        var response_object = {
          response_id: response.id,
          participant_id: response.participant_id,
          participant_name: response.name || response.aws_worker_id,
          experiment_id: response.experiment_id,
          block_id: response.block_id,
          created: response.created,
        };
        // merge those static values with the dynamic context and value objects,
        // using _.defaults so that further-left arguments have priority
        // if value is null, that will stall the writer, which we don't want
        var row = _.defaults(response.value || {}, response_object, response.context);
        writer.write(row);
      });
      writer.end();
    });
  });
});

module.exports = R.route.bind(R);
