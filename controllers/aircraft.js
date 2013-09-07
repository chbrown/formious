'use strict'; /*jslint node: true, indent: 2, vars: true, es5: true */
var url = require('url');
var mechturk = require('mechturk');
var _ = require('underscore');
var amulet = require('amulet');
var vsprintf = require('sprintf').vsprintf;

var logger = require('../lib/logger');
var misc = require('../lib/misc');
var models = require('../lib/models');

function allyJudgment(reliability, truth, prior_on_enemy) {
  // var prior_on_enemy = 1 - prior_on_friend;
  // var prior_on_truth = truth == 'enemy' ? prior_on_enemy : prior_on_friend;
  // var ally_is_correct = Math.random() < reliability + (1-reliability)*prior_on_truth;
  // var other = truth == 'enemy' ? 'pass' : 'enemy';
  // return ally_is_correct ? truth : other;
  if (truth == 'enemy') {
    return Math.random() < reliability + (1 - reliability)*prior_on_enemy ? 'enemy' : 'pass';
  }
  else {
    return Math.random() < reliability + (1 - reliability)*(1 - prior_on_enemy) ? 'pass' : 'enemy';
  }
}

function makeBatch(prior_on_enemy, number_of_scenes, allies, widths) {
  // thus prior_on_enemy=0.95 -> 95% marginal probability that an airplane is friendly.
  var total_enemy = (prior_on_enemy * number_of_scenes) | 0;
  var total_friendly = number_of_scenes - total_enemy;

  var scenes = _.range(number_of_scenes).map(function(scene_index) {
    var width = misc.sample(widths);
    var image_id = (Math.random() * 100) | 0;
    var truth = scene_index < total_enemy ? 'enemy' : 'friend';
    return {
      image_id: image_id,
      truth: truth,
      width: width,
      src: vsprintf('%s-%02d-%03d.jpg', [truth, image_id, width]),
      allies: allies.map(function(ally) {
        var judgment = allyJudgment(ally.reliability, truth, prior_on_enemy);
        return _.extend({judgment: judgment}, ally);
      })
    };
  });

  var shuffled_scenes = _.shuffle(scenes).map(function(scene, scene_index) {
    scene.id = scene_index + 1;
    return scene;
  });

  return {
    prior: prior_on_enemy,
    scenes: shuffled_scenes,
    total_friendly: total_friendly,
    total_enemy: total_enemy
  };
}

module.exports = function(m, req, res) {
  // A batch shows scenes, so we start with the batch.
  // When a batch starts, it's given a batchmodel, which contains a collection of scenes
  // A scene must attach inside a batch
  var names = ['Armstrong', 'Cardoso', 'Darlak', 'Gaouette', 'Hartman', 'Klein',
    'Marin', 'Parker', 'Riedel', 'Tannahill', 'Williams'];
  var widths = [10, 25, 50, 75, 100, 150]; // from conv.py
  var priors = [0.1, 0.3, 0.5, 0.7, 0.9];
  var scenes_per_batch = 50;

  var urlObj = url.parse(req.url, true);
  // a normal turk request looks like: urlObj.query =
  // { assignmentId: '2NXNWAB543Q0EQ3C16EV1YB46I8620K',
  //   hitId: '2939RJ85OZIZ4RKABAS998123Q9M8NEW85',
  //   workerId: 'A9T1WQR9AL982W',
  //   turkSubmitTo: 'https://www.mturk.com' },
  var ctx = {
    assignmentId: urlObj.query.assignmentId,
    hitId: urlObj.query.hitId,
    workerId: (urlObj.query.workerId || req.user_id).replace(/\W+/g, ''),
    host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
    task_started: Date.now()
  };
  req.cookies.set('workerId', ctx.workerId);

  // a preview request will be the same, minus workerId and turkSubmitTo,
  // and assignmentId will always then be 'ASSIGNMENT_ID_NOT_AVAILABLE'
  var allies = names.slice(0, 5).map(function(name) {
    return {
      title: 'Lt.',
      name: name,
      reliability: Math.random() // = misc.randRange(0.0, 1.0), maybe switch in a beta later
    };
  });

  models.User.fromId(ctx.workerId, function(err, user) {
    if (err) return res.die('User query error: ' + err);

    var batch_priors = _.shuffle(priors);
    // first is the training batch
    batch_priors.unshift(0.5);
    ctx.batches = batch_priors.map(function(prior, i) {
      var batch = makeBatch(prior, scenes_per_batch, allies, widths);
      batch.bonus = i > 1 ? 0.25 : 0.00;
      batch.id = i + 1;
      return batch;
    });
    amulet.stream(['layout.mu', 'aircraft.mu'], ctx).pipe(res);
  });
};
