'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var url = require('url');
var mechturk = require('mechturk');
var mechturk_params = require('./mechturk-params');
var __ = require('underscore');
var amulet = require('amulet');
var formidable = require('formidable');
var vsprintf = require('sprintf').vsprintf;

var util = require('./util');
var models = require('./models');
var User = models.User;
var logger = require('./logger');


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

  var scenes = __.range(number_of_scenes).map(function(scene_index) {
    var width = util.sample(widths);
    var image_id = (Math.random() * 100) | 0;
    var truth = scene_index < total_enemy ? 'enemy' : 'friend';
    return {
      image_id: image_id,
      truth: truth,
      width: width,
      src: vsprintf('%s-%02d-%03d.jpg', [truth, image_id, width]),
      allies: allies.map(function(ally) {
        var judgment = allyJudgment(ally.reliability, truth, prior_on_enemy);
        return __.extend({judgment: judgment}, ally);
      })
    };
  });

  var shuffled_scenes = __.shuffle(scenes).map(function(scene, scene_index) {
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

module.exports = function(R) {

  R.get(/aircraft/, function(m, req, res) {
    // A batch shows scenes, so we start with the batch.
    // When a batch starts, it's given a batchmodel, which contains a collection of scenes
    // A scene must attach inside a batch

    // constants
    var names = ['Armstrong', 'Cardoso', 'Darlak', 'Gaouette', 'Hartman', 'Klein',
      'Marin', 'Parker', 'Riedel', 'Tannahill', 'Williams'];
    var widths = [10, 25, 50, 75, 100, 150]; // from conv.py
    var priors = [0.1, 0.3, 0.5, 0.7, 0.9];
    var scenes_per_batch = 50;

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

    // a preview request will be the same, minus workerId and turkSubmitTo,
    // and assignmentId will always then be 'ASSIGNMENT_ID_NOT_AVAILABLE'
    var allies = names.slice(0, 5).map(function(name) {
      return {
        title: 'Lt.',
        name: name,
        reliability: util.randRange(0.0, 1.0) // maybe switch in a beta later
      };
    });

    User.findById(context.workerId, function(err, user) {
      logger.maybe(err);
      if (!user) {
        user = new User({_id: context.workerId});
        user.save(logger.maybe);
      }

      var batch_priors = __.shuffle(priors);
      // first is the training batch
      batch_priors.unshift(0.5);
      context.batches = batch_priors.map(function(prior, i) {
        var batch = makeBatch(prior, scenes_per_batch, allies, widths);
        batch.bonus = i > 1 ? 0.25 : 0.00;
        batch.id = i + 1;
        return batch;
      });
      amulet.render(res, ['layout.mu', 'aircraft.mu'], context);
    });
  });

  R.post(/\/responses/, function(m, req, res) {
    var workerId = (req.cookies.get('workerId') || 'none').replace(/\W+/g, '');

    req.on('end', function() {
      var response = JSON.parse(req.data);
      response.submitted = new Date();
      User.findById(workerId, function(err, user) {
        logger.maybe(err);
        if (user) {
          user.responses.push(response);
          user.save(logger.maybe);
        }
        res.json({success: true, message: 'Saved response for user: ' + workerId});
      });
    });
  });

  R.post(/\/request-bonus/, function(m, req, res) {
    // var unpaid_minimum = 49;
    new formidable.IncomingForm().parse(req, function(err, fields, files) {
      var workerId = (fields.workerId || req.cookies.get('workerId') || 'none').replace(/\W+/g, '');
      User.findById(workerId, function(err, user) {
        logger.maybe(err);
        if (user) {
          // var unpaid = user.responses.length - user.paid;
          var amount = Math.min(parseFloat(fields.amount || 0.25), 0.25);
          var previous_bonus_owed = user.get('bonus_owed');
          user.set('bonus_owed', previous_bonus_owed + amount);
          user.save(function(err) {
            if (err) {
              logger.error(err);
              res.json({success: false, message: 'Error assigning bonus: ' + err.toString(), amount: amount});
            }
            else {
              logger.info('User bonus_owed increased from ' + previous_bonus_owed +
                ' by ' + amount + ' to ' + (previous_bonus_owed + amount) + '.');
              res.json({success: true, message: 'Bonus awarded: $' + amount, amount: amount});
            }
          });
          // if (unpaid >= unpaid_minimum) {
          //   var turk_client = mechturk_params.mechturk('sandbox', 'ut', {logger: logger});
          //   var params = {
          //     AssignmentId: fields.assignmentId,
          //     WorkerId: workerId,
          //     BonusAmount: new mechturk.models.Price(amount),
          //     Reason: 'Batch completion'
          //   };
          //   turk_client.GrantBonus(params, function(err, result) {
          //     if (err) {
          //       logger.error(err);
          //       res.json({success: false, message: 'Error awarding bonus. ' + err.toString()});
          //     }
          //     else {
          //       var result_string = util.inspect(result, {showHidden: true, depth: 5});
          //       logger.info('Bonus of ' + amount + ' granted to worker: ' + workerId + '. ' + result_string);
          //       user.set('paid', user.responses.length);
          //       user.save(logger.maybe);
          //       res.json({success: true, message: 'Bonus awarded: $' + amount, amount: amount});
          //     }
          //   });

          // }
          // else {
          //   var message = 'Not yet eligible for bonus. Must answer at least ' + (unpaid_minimum - unpaid) + ' more hits.';
          //   res.json({success: false, message: message, unpaid: unpaid});
          // }
        }
        else {
          res.json({success: false, message: 'Could not find user: ' + workerId});
        }
      });
    });
  });

  R.get(/\/responses/, function(m, req, res) {
    amulet.render(res, ['layout.mu', 'responses.mu'], {});
  });

};
