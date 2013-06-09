'use strict'; /*jslint node: true, es5: true, indent: 2 */
var url = require('url');
var mechturk = require('mechturk');
var _ = require('underscore');
var amulet = require('amulet');
var formidable = require('formidable');
var User = require('../models').User;
var logger = require('../logger');
var Router = require('regex-router');
var R = new Router();

// /stimlist
module.exports = function(m, req, res) {
  var workerId = (req.cookies.get('workerId') || '').replace(/\W+/g, '');
  User.fromId(workerId, function(err, user) {
    req.user = user;
    R.route(req, res);
  });
};


R.get(/^\/stimlist\/new/, function(m, req, res) {
});

R.get(/^\/stimlist\/(.+)/, function(m, req, res) {
  var urlObj = url.parse(req.url, true);
  var spreadsheet = m[1];
  // logger.info('request', {url: urlObj, headers: req.headers});
  // a normal turk request looks like: urlObj.query =
  // { assignmentId: '2NXNWAB543Q0EQ3C16EV1YB46I8620K',
  //   hitId: '2939RJ85OZIZ4RKABAS998123Q9M8NEW85',
  //   workerId: 'A9T1WQR9AL982W',
  //   turkSubmitTo: 'https://www.mturk.com' },
  var workerId = (urlObj.query.workerId || req.cookies.get('workerId') || '').replace(/\W+/g, '');
  var ctx = {
    assignmentId: urlObj.query.assignmentId,
    hitId: urlObj.query.hitId,
    workerId: workerId,
    host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
    task_started: Date.now(),
    batches_per_HIT: parseInt(urlObj.query.batches, 10) || 5,
    scenes_per_batch: parseInt(urlObj.query.scenes, 10) || 4, // i.e., digits per screen
    allies_per_scene: parseInt(urlObj.query.allies, 10) || 5,
    feedback_duration: parseInt(urlObj.query.feedback, 10) || 2000, // how long to show the smiley, in ms
  };
  req.cookies.set('workerId', workerId);

  // a preview request will be the same, minus workerId and turkSubmitTo,
  // and assignmentId will always then be 'ASSIGNMENT_ID_NOT_AVAILABLE'
  var allies = _.shuffle(names).slice(0, ctx.allies_per_scene).map(function(name) {
    return {
      title: 'Sgt.',
      name: name,
      reliability: random.range(0.0, 1.0) // maybe switch in a beta later
    };
  });

  User.findById(workerId, function(err, user) {
    logger.maybe(err);
    if (!user) {
      user = new User({_id: workerId});
      user.save(logger.maybe);
    }

    ctx.batches = _.range(ctx.batches_per_HIT).map(function(batch_index) {
      var batch = makeBatch(allies, ctx.scenes_per_batch);
      batch.id = batch_index + 1;
      return batch;
    });
    amulet.render(res, ['layout.mu', 'digits.mu'], ctx);
  });
});
