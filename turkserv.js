#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var url = require('url');
var __ = require('underscore');
var winston = require('winston');
var amulet = require('amulet');
var http = require('./http-enhanced');
var Cookies = require('cookies');
var Router = require('regex-router');
var formidable = require('formidable');
var vsprintf = require('sprintf').vsprintf;
var R = new Router();
var yaml = require('js-yaml');
var util = require('./util');
var models = require('./models');
var User = models.User;
var argv = require('optimist').default({port: 1451, hostname: '127.0.0.1'}).argv;

amulet.set({minify: true, root: path.join(__dirname, 'templates')});
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({filename: '/usr/local/var/log/turkserv.log'}) // , handleExceptions: true
  ]
});
function logerr(err) { if (err) logger.error(err); }

Cookies.prototype.defaults = function() {
  var expires = new Date(Date.now() + (31 * 24 * 60 * 60 * 1000)); // 1 month
  return {expires: expires};
};

var names = ['Armstrong', 'Cardoso', 'Darlak', 'Gaouette', 'Hartman', 'Klein',
  'Marin', 'Parker', 'Riedel', 'Tannahill', 'Williams'];
var widths = [10, 25, 50, 75, 100, 150]; // from conv.py
var priors = [0.1, 0.3, 0.5, 0.7, 0.9];
var total_planes = 50;
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
//     logerr(err);
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

function addBatchesContext(context) {
  // variables:
  // 1. number of allies providing judgments
  // 2. their history (shown, not show / good, not good)
  // 3. degree of pixelation
  // 4. scenario stating how many there of each type of aircraft are in the skies
  // 5. feedback or not

  context.task_started = Date.now();

  var allies = names.slice(0, 5).map(function(name) {
    return {
      title: 'Lt.',
      name: name,
      reliability: util.randRange(0.5, 1.0) // maybe switch in a beta later
    };
  });

  function batch(prior, number_of_scenes) {
    var ctx = {
      prior: prior,
      total_friendly: (prior * total_planes) | 0
    };
    ctx.total_enemy = total_planes - ctx.total_friendly;

    ctx.scenes = __.range(number_of_scenes).map(function(scene_index) {
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
          var ally_is_correct = Math.random() < ally.reliability;
          var prior_is_correct = Math.random() < prior;
          ally_with_judgment.judgment = (ally_is_correct || prior_is_correct) ? gold : wrong;
          return ally_with_judgment;
        })
      };
    });
    return ctx;
  }

  // first is the training batch
  context.batches.push(batch(0.5, 50));
  util.shuffle(priors).forEach(function(prior) {
    context.batches.push(batch(prior, 50));
  });
}

R.default = function(m, req, res) {
  var urlObj = url.parse(req.url, true);
  logger.info('request', {url: urlObj, headers: req.headers});
  // a normal turk request looks like: urlObj.query =
  // { assignmentId: '2NXNWAB543Q0EQ3C16EV1YB46I8620K',
  //   hitId: '2939RJ85OZIZ4RKABAS998123Q9M8NEW85',
  //   workerId: 'A9T1WQR9AL982W',
  //   turkSubmitTo: 'https://www.mturk.com' },
  var context = {
    assignmentId: urlObj.query.assignmentId,
    hitId: urlObj.query.hitId,
    workerId: (urlObj.query.workerId || req.cookies.get('workerId') || '').replace(/\W+/g, ''),
    host: urlObj.query.turkSubmitTo || 'https://www.mturk.com'
    // remaining: Math.min(per_page*10, questions.length)
  };

  if (urlObj.query.debug !== undefined) {
    context.host = '';
  }

  // a preview request will be the same, minus workerId and turkSubmitTo,
  // and assignmentId will always then be 'ASSIGNMENT_ID_NOT_AVAILABLE'
  // if (!context.workerId) {
  //   renderAircraft(req, res, null, context);
  // }
  // else {
  req.cookies.set('workerId', context.workerId);
  User.findById(context.workerId, function(err, user) {
    logerr(err);
    // no difference for amount of questions seen, at the moment.
    // if (user.seen && user.seen.length) {
    //   context.remaining -= user.seen.length;
    // }
    if (!user) {
      user = new User({_id: context.workerId});
      user.save(logerr);
    }
    addBatchesContext(context);
    amulet.render(res, ['layout.mu', 'aircraft.mu'], context);
  });
  // }

};

R.post(/seen/, function(m, req, res) {
  // a POST to /seen should have MIME type "application/x-www-form-urlencoded"
  // and the fields: workerId, and "questionIds[]" that equates to a list of strings
  // which is just multiple 'questionIds[] = string1' fields (I think).
  new formidable.IncomingForm().parse(req, function(err, fields, files) {
    var workerId = fields.workerId; // || req.cookies.get('workerId') || null;
    if (workerId) {
      User.findById(workerId, function(err, user) {
        logerr(err);
        if (user) {
          var questionIds = fields['questionIds[]'];
          if (Array.isArray(questionIds)) {
            questionIds.forEach(function(questionId) {
              user.seen.push(questionId);
            });
          }
          user.save(logerr);
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
      logerr(err);
      if (user) {
        user.responses.push(response);
        user.save(logerr);
      }
      res.json({success: true, message: 'Saved response for user: ' + workerId});
    });
  });
});

function writeRow(out, cells) {
  out.write(cells.join('\t'));
  out.write('\n');
}

R.get(/\/responses.tsv/, function(m, req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});

  user_stream = User.find({responses: {$ne: []}}).sort('-created').stream();
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
  user_stream.on('error', logerr);
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


R.get(/\/favicon.ico/, function(m, req, res) {
  res.writeHead(404);
  res.end();
});

// expose this module's methods incase anything wants them
if (require.main === module) {
  http.createServer(function(req, res) {
    req.data = ''; req.on('data', function(chunk) { req.data += chunk; });
    req.cookies = new Cookies(req, res);
    logger.info('URL: ' + req.url);

    var started = Date.now();
    res.end = function() {
      logger.info('duration', {url: req.url, method: req.method, ms: Date.now() - started});
      http.ServerResponse.prototype.end.apply(res, arguments);
    };

    R.route(req, res);
  }).listen(argv.port, argv.hostname);
  logger.info('Turkserv ready at ' + argv.hostname + ':' + argv.port);
}
