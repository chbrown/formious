#!/usr/bin/env node
var fs = require('fs'),
  path = require('path'),
  http = require('http'),
  url = require('url'),

  __ = require('underscore'),
  winston = require('winston'),
  amulet = require('amulet'),
  Cookies = require('cookies'),
  Router = require('regex-router'),
  formidable = require('formidable'),
  crypto = require('crypto'),
  vsprintf = require('sprintf').vsprintf,
  R = new Router(),

  yaml = require('js-yaml'),

  util = require('./util'),
  models = require('./models'),
  User = models.User,
  argv = require('optimist').default({port: 1451, hostname: '127.0.0.1'}).argv;

amulet.set({minify: true, root: path.join(__dirname, 'templates')});
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({filename: '/usr/local/var/log/turkserv.log'}) // , handleExceptions: true
  ]
});
function logerr(err) { if (err) logger.error(err); }

function md5(string) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(string);
  return md5sum.digest('hex');
}

Cookies.prototype.defaults = function() {
  var expires = new Date(Date.now() + (31 * 24 * 60 * 60 * 1000)); // 1 month
  return {expires: expires};
};

http.ServerResponse.prototype.writeEnd = function(s) { this.write(s); this.end(); };
http.ServerResponse.prototype.writeAll = function(http_code, content_type, body) {
  this.writeHead(http_code, {'Content-Type': content_type});
  this.writeEnd(body);
};
http.ServerResponse.prototype.json = function(obj) {
  this.writeAll(200, 'application/json', JSON.stringify(obj));
};
http.ServerResponse.prototype.text = function(str) {
  this.writeAll(200, 'text/plain', str);
};
http.ServerResponse.prototype.die = function(err) {
  this.writeAll(500, 'text/plain', 'Failure: ' + err.toString());
};

var names = ['Armstrong', 'Cardoso', 'Darlak', 'Gaouette', 'Hartman', 'Klein',
  'Marin', 'Parker', 'Riedel', 'Tannahill', 'Williams'];
var widths = [10, 25, 50, 75, 100, 150]; // from conv.py
var prior_total = [0.1, 0.3, 0.5, 0.7, 0.9];
var total_planes = 50;

function renderAircraft(req, res, user, context) {
  // variables:
  // 1. number of allies providing judgments
  // 2. their history (shown, not show / good, not good)
  // 3. degree of pixelation
  // 4. scenario stating how many there of each type of aircraft are in the skies
  // 5. feedback or not

  context.task_started = Date.now();
  context.prior = util.sample(prior_total); // probability of friend (same for whole task)
  context.total_friendly = (context.prior * total_planes) | 0;
  context.total_enemy = total_planes - context.total_friendly;

  var allies = names.slice(0, 5).map(function(name) {
    return {
      title: 'Lt.',
      name: name,
      reliability: Math.random() // maybe switch in a beta later
    };
  });

  context.scenes = __.range(100).map(function(scene_index) {
    var width = util.sample(widths);
    var image_id = (Math.random() * 100) | 0;
    var gold = (Math.random() < context.prior) ? 'friend' : 'enemy';
    var wrong = gold == 'enemy' ? 'friend' : 'enemy';
    return {
      index: scene_index + 1,
      gold: gold,
      image_id: image_id,
      width: width,
      src: vsprintf('%s-%02d-%03d.jpg', [gold, image_id, width]),
      allies: allies.map(function(ally) {
        var ally_with_judgment = __.clone(ally);
        // with probability ally.reliability, pick the correct side of the gold standard which
        // was picked on the friend_enemy declaration line
        ally_with_judgment.judgment = Math.random() < ally.reliability ? gold : wrong;
        return ally_with_judgment;
      })
    };
  });

  amulet.render(res, ['layout.mu', 'aircraft.mu'], context);
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
  if (!context.workerId) {
    renderAircraft(req, res, null, context);
  }
  else {
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
      renderAircraft(req, res, user, context);
    });
  }

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
    res.writeAll(200, 'application/json', JSON.stringify(fields, undefined, '  '));
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

    try {
      R.route(req, res);
    }
    catch (exc) {
      logger.error(exc, {url: req ? req.url : null, stack: exc.stack});
    }
  }).listen(argv.port, argv.hostname);
  logger.info('Turkserv ready at ' + argv.hostname + ':' + argv.port);
}
