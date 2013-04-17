'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var url = require('url');
var mechturk = require('mechturk');
var mechturk_params = require('./mechturk-params');
var models = require('./models');
var User = models.User;
var __ = require('underscore');
var util = require('./util');
var amulet = require('amulet');
var formidable = require('formidable');
var vsprintf = require('sprintf').vsprintf;

var logger = require('./logger');

// var number_of_scenes = 100;
// var prior_queue = [];

// R.get(/\/priors.txt/, function(m, req, res) {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   var body = prior_queue.map(function(d) { return d.toString(); }).join('; ');
//   res.write(body);
//   res.end();
// });

// function updatePriorQueueHack() {
//   // group by prior and count
//   var priors = prior_total.map(function() { return 0; });
//   var two_weeks_ago = new Date(new Date().getTime() - 14*24*60*60*1000);

//   User.find({created: {$gt: two_weeks_ago}, $where: "this.responses.length == 100"}).exec(function(err, users) {
//     // logger.info("Found #users: " + users.length);
//     logger.maybe(err);
//     users.forEach(function(user) {
//       priors[prior_total.indexOf(user.responses[0].prior)]++;
//     });

//     logger.info("Priors already tested (counts): " + priors);
//     prior_queue = [];
//     prior_total.forEach(function(prior, i) {
//       var missing = 10 - priors[i];
//       if (missing > 0)
//         util.extend(prior_queue, util.repeat(prior, missing));
//     });
//     util.shuffle(prior_queue);
//   });
// }

// updatePriorQueueHack();
// setInterval(updatePriorQueueHack, 60000); // once a minute

// function nextPrior() {
//   if (prior_queue.length) {
//     return prior_queue.pop();
//   }
//   return util.sample(prior_total);
// }

function allyJudgment(gold, prior, reliability) {
  if (gold == 'enemy') {
    return (Math.random() < reliability + (1-reliability)*prior) ? 'enemy' : 'pass';
  }
  else { // if (gold == 'friend')
    return (Math.random() < (1-reliability)*prior) ? 'enemy' : 'pass';
  }
}

function makeBatch(prior, number_of_scenes, allies, widths) {
  // prior describes the probability of a friend.
  // thus prior=0.95 -> 95% marginal probability that an airplane is friendly.
  var total_friendly = (prior * number_of_scenes) | 0;
  var total_enemy = number_of_scenes - total_friendly;

  var scenes = __.range(number_of_scenes).map(function(scene_index) {
    var width = util.sample(widths);
    var image_id = (Math.random() * 100) | 0;
    var gold = scene_index < total_friendly ? 'friend' : 'enemy';
    return {
      image_id: image_id,
      gold: gold,
      width: width,
      src: vsprintf('%s-%02d-%03d.jpg', [gold, image_id, width]),
      allies: allies.map(function(ally) {
        var ally_with_judgment = __.clone(ally);
        ally_with_judgment.judgment = allyJudgment(gold, prior, ally.reliability);
        return ally_with_judgment;
      })
    };
  });

  var shuffled_scenes = __.shuffle(scenes).map(function(scene, scene_index) {
    scene.id = scene_index + 1;
    return scene;
  });

  return {
    prior: prior,
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

  // R.post(/seen/, function(m, req, res) {
  //   // a POST to /seen should have MIME type "application/x-www-form-urlencoded"
  //   // and the fields: workerId, and "questionIds[]" that equates to a list of strings
  //   // which is just multiple 'questionIds[] = string1' fields (I think).
  //   new formidable.IncomingForm().parse(req, function(err, fields, files) {
  //     var workerId = fields.workerId; // || req.cookies.get('workerId') || null;
  //     if (workerId) {
  //       User.findById(workerId, function(err, user) {
  //         logger.maybe(err);
  //         if (user) {
  //           var questionIds = fields['questionIds[]'];
  //           if (Array.isArray(questionIds)) {
  //             questionIds.forEach(function(questionId) {
  //               user.seen.push(questionId);
  //             });
  //           }
  //           user.save(logger.maybe);
  //           res.text('success');
  //         }
  //         else {
  //           res.text('no worker');
  //         }
  //       });
  //     }
  //     else {
  //       res.text('no worker id');
  //     }
  //   });
  // });

  R.post(/\/mturk\/externalSubmit/, function(m, req, res) {
    var workerId = (req.cookies.get('workerId') || 'none').replace(/\W+/g, '');
    new formidable.IncomingForm().parse(req, function(err, fields, files) {
      User.findById(workerId, function(err, user) {
        logger.maybe(err);
        if (user) {
          user.responses.push(fields);
          user.save(logger.maybe);
        }
        amulet.render(res, ['layout.mu', 'submit.mu'], {});
      });
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

  R.get(/\/responses.tsv/, function(m, req, res) {
    var writeRow = function(out, cells) {
      out.write(cells.join('\t'));
      out.write('\n');
    };

    res.writeHead(200, {'Content-Type': 'text/plain'});

    var user_stream = User.find({responses: {$ne: []}}).sort('-created').stream();
    var headers = [
      'workerId',
      'task_started',
      'prior',
      'scene_index',
      'reliability1',
      'reliability2',
      'reliability3',
      'reliability4',
      'reliability5',
      'judgment1',
      'judgment2',
      'judgment3',
      'judgment4',
      'judgment5',
      'gold',
      'image_id',
      'width',
      'correct',
      'time',
      'submitted'
    ];
    writeRow(res, headers);

    user_stream.on('data', function (user) {
      user.responses.filter(function(r) {
        // test_user_ids.indexOf(r.workerId) === -1 &&
        return r.workerId && r.workerId.match(/^A/);
      }).forEach(function(r) {
        var cells = [
          r.workerId,
          r.task_started,
          r.prior,
          r.scene_index
        ];
        util.extend(cells, r.reliabilities);
        util.extend(cells, r.judgments);
        util.extend(cells, [
          r.gold,
          r.image_id,
          r.width,
          r.correct,
          r.time,
          r.submitted ? r.submitted.toISOString().replace(/\..+$/, '') : ''
        ]);
        writeRow(res, cells);
      });
    });
    user_stream.on('error', logger.maybe);
    user_stream.on('close', function () {
      res.end();
    });
  });

  R.get(/\/responses\/(\d+)\.json/, function(m, req, res) {
    var page = parseInt(m[1], 10);
    var per_page = 10;
    User.find({responses: {$ne: []}}).skip(page*per_page).limit(per_page).sort('-created').exec(function(err, users) {
      var responses = [];
      users.forEach(function(user) {
        util.extend(responses, user.responses);
      });
      res.json(responses);
    });
  });

  R.get(/\/responses/, function(m, req, res) {
    amulet.render(res, ['layout.mu', 'responses.mu'], {});
  });

};
