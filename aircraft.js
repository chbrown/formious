'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var url = require('url');
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
    var total_planes = 50;
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
        reliability: util.randRange(0.5, 1.0) // maybe switch in a beta later
      };
    });

    function allyJudgment(gold, prior, reliability) {
      if (gold == 'enemy') {
        return (Math.random() < reliability + (1-reliability)*prior) ? 'enemy' : 'friend';
      }
      else { // if (gold == 'friend')
        return (Math.random() < (1-reliability)*prior) ? 'enemy' : 'friend';
      }
    }

    function makeBatch(prior, number_of_scenes) {
      // prior describes the probability of a friend.
      // thus prior=0.95 -> 95% marginal probability that an airplane is friendly.
      var batch = {prior: prior};
      batch.total_friendly = (prior * total_planes) | 0;
      batch.total_enemy = total_planes - batch.total_friendly;
      batch.scenes = __.range(number_of_scenes).map(function(scene_index) {
        // create the scene:
        var width = util.sample(widths);
        var image_id = (Math.random() * 100) | 0;
        var gold = (Math.random() < prior) ? 'friend' : 'enemy';
        var wrong = gold == 'enemy' ? 'friend' : 'enemy';
        return {
          id: scene_index + 1,
          gold: gold,
          image_id: image_id,
          width: width,
          src: vsprintf('%s-%02d-%03d.jpg', [gold, image_id, width]),
          allies: allies.map(function(ally) {
            var ally_with_judgment = __.clone(ally);
            // with probability ally.reliability, pick the correct side of the gold standard which
            // was picked on the friend_enemy declaration line
            // var ally_is_correct = Math.random() < ally.reliability;
            // var prior_on_correct = correct == 'friend' ? prior : 1 - prior;
            // var prior_is_correct = Math.random() < prior_on_correct;
            ally_with_judgment.judgment = allyJudgment(gold, prior, ally.reliability);
            return ally_with_judgment;
          })
        };
      });
      return batch;
    }

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
        var batch = makeBatch(prior, scenes_per_batch);
        batch.bonus = i > 1 ? 0.25 : 0;
        batch.id = i + 1;
        return batch;
      });
      amulet.render(res, ['layout.mu', 'aircraft.mu'], context);
    });
  });

  R.post(/seen/, function(m, req, res) {
    // a POST to /seen should have MIME type "application/x-www-form-urlencoded"
    // and the fields: workerId, and "questionIds[]" that equates to a list of strings
    // which is just multiple 'questionIds[] = string1' fields (I think).
    new formidable.IncomingForm().parse(req, function(err, fields, files) {
      var workerId = fields.workerId; // || req.cookies.get('workerId') || null;
      if (workerId) {
        User.findById(workerId, function(err, user) {
          logger.maybe(err);
          if (user) {
            var questionIds = fields['questionIds[]'];
            if (Array.isArray(questionIds)) {
              questionIds.forEach(function(questionId) {
                user.seen.push(questionId);
              });
            }
            user.save(logger.maybe);
            res.text('success');
          }
          else {
            res.text('no worker');
          }
        });
      }
      else {
        res.text('no worker id');
      }
    });
  });

  R.post(/\/mturk\/externalSubmit/, function(m, req, res) {
    new formidable.IncomingForm().parse(req, function(err, fields, files) {
      res.json(fields);
    });
  });

  R.post(/\/save/, function(m, req, res) {
    var urlObj = url.parse(req.url, true);
    var workerId = (urlObj.query.workerId || req.cookies.get('workerId') || '').replace(/\W+/g, '');

    req.on('end', function() {
      var response = JSON.parse(req.data);
      response.submitted = new Date();
      User.findById(workerId || 'none', function(err, user) {
        logger.maybe(err);
        if (user) {
          user.responses.push(response);
          user.save(logger.maybe);
        }
        res.json({success: true, message: 'Saved response for user: ' + workerId});
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
