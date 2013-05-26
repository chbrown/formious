'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var url = require('url');
var mechturk = require('mechturk');
var mechturk_params = require('./mechturk-params');
var _ = require('underscore');
var amulet = require('amulet');
var formidable = require('formidable');
var vsprintf = require('sprintf').vsprintf;

var random = require('./random');
var User = require('./models').User;
var logger = require('./logger');

var names = ['Banks', 'Barkley', 'Bowers', 'Dean', 'Frederick', 'Henderson',
  'Jacob', 'Kimball', 'Malackany', 'Malcom', 'Marin', 'Parker', 'Riedel',
  'Tannahill', 'Thibault', 'Wakerfield', 'Williams'];

var digit_segments = [
  [1, 1, 1, 0, 1, 1, 1], // 0
  [0, 0, 1, 0, 0, 1, 0], // 1
  [1, 0, 1, 1, 1, 0, 1], // 2
  [1, 0, 1, 1, 0, 1, 1], // 3
  [0, 1, 1, 1, 0, 1, 0], // 4
  [1, 1, 0, 1, 0, 1, 1], // 5
  [1, 1, 0, 1, 1, 1, 1], // 6
  [1, 0, 1, 0, 0, 1, 0], // 7
  [1, 1, 1, 1, 1, 1, 1], // 8
  [1, 1, 1, 1, 0, 1, 1]  // 9
];

function degrade(original, n) {
  var segments = _.clone(original);
  // @original is a 7-long list of segment indices, binary values (on/off)
  // @n is a integer for number of flips
  // returns a new list.
  _.range(n).forEach(function() {
    var i = Math.random() * 7 | 0;
    segments[i] = 1 - segments[i];
  });
  return segments;
}

function makeJudgment(ally, truth) {
  if (Math.random() < ally.reliability) {
    return truth;
  }
  else {
    return Math.random() * 10 | 0;
  }
}

function makeScene(allies, number_of_degradations) {
  var truth = Math.random() * 10 | 0;
  return {
    truth: truth,
    truth_segments: digit_segments[truth],
    number_of_degradations: number_of_degradations,
    degraded_segments: degrade(digit_segments[truth], number_of_degradations),
    allies: allies.map(function(ally) {
      return _.extend({judgment: makeJudgment(ally, truth)}, ally);
    })
  };
}

function makeBatch(allies, scenes_per_batch) {
  var number_of_degradations = Math.random() * 5 | 0;
  var scenes = _.range(scenes_per_batch).map(function(scene_index) {
    var scene = makeScene(allies, number_of_degradations);
    scene.id = scene_index + 1;
    return scene;
  });
  return {scenes: scenes};
}

module.exports = function(R) {
  R.any(/digits/, function(m, req, res) {
    var urlObj = url.parse(req.url, true);
    // logger.info('request', {url: urlObj, headers: req.headers});
    // a normal turk request looks like: urlObj.query =
    // { assignmentId: '2NXNWAB543Q0EQ3C16EV1YB46I8620K',
    //   hitId: '2939RJ85OZIZ4RKABAS998123Q9M8NEW85',
    //   workerId: 'A9T1WQR9AL982W',
    //   turkSubmitTo: 'https://www.mturk.com' },
    var context = {
      assignmentId: urlObj.query.assignmentId,
      hitId: urlObj.query.hitId,
      workerId: (urlObj.query.workerId || req.cookies.get('workerId') || '').replace(/\W+/g, ''),
      host: urlObj.query.debug !== undefined ? '' : (urlObj.query.turkSubmitTo || 'https://www.mturk.com'),
      task_started: Date.now()
    };
    req.cookies.set('workerId', context.workerId);

    var batches_per_HIT = parseInt(urlObj.query.batches, 10) || 5;
    var scenes_per_batch = parseInt(urlObj.query.scenes, 10) || 4; // i.e., digits per screen
    var allies_per_scene = parseInt(urlObj.query.allies, 10) || 5;

    // a preview request will be the same, minus workerId and turkSubmitTo,
    // and assignmentId will always then be 'ASSIGNMENT_ID_NOT_AVAILABLE'
    var allies = _.shuffle(names).slice(0, allies_per_scene).map(function(name) {
      return {
        title: 'Sgt.',
        name: name,
        reliability: random.range(0.0, 1.0) // maybe switch in a beta later
      };
    });

    User.findById(context.workerId, function(err, user) {
      logger.maybe(err);
      if (!user) {
        user = new User({_id: context.workerId});
        user.save(logger.maybe);
      }

      context.batches = _.range(batches_per_HIT).map(function(batch_index) {
        var batch = makeBatch(allies, scenes_per_batch);
        batch.id = batch_index + 1;
        return batch;
      });
      amulet.render(res, ['layout.mu', 'digits.mu'], context);
    });
  });

};
