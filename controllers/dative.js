'use strict'; /*jslint node: true, es5: true, indent: 2 */
var fs = require('fs');
var path = require('path');
var url = require('url');

var _ = require('underscore');
var yaml = require('js-yaml');
var amulet = require('amulet');
var Router = require('regex-router');

var logger = require('../lib/logger');
var misc = require('../lib/misc');
var models = require('../lib/models');

var per_page = 10;
var questions = [];
fs.readFile(path.join(__dirname, 'stimuli.yaml'), 'utf8', function (err, stimuli_yaml) {
  yaml.loadAll(stimuli_yaml, function(stimuli) {
    // generate all sentences
    var loaded_ids = [];
    stimuli.forEach(function(stimulus) {
      if (stimulus.active) {
        ['do', 'po'].forEach(function(type) {
          stimulus.continuations.forEach(function(continuation) {
            // DO = John gave Mary an elephant.
            // PO = John gave an elephant to Mary.
            var text = stimulus.base + ' ';
            if (type === 'do')
              text += stimulus.recipient + ' ' + stimulus.object;
            else
              text += stimulus.object + ' to ' + stimulus.recipient;
            text += continuation.text;
            var id = [stimulus.id, type, continuation.id].join('-');
            questions.push({id: id, text: text});
            if (loaded_ids.indexOf(id) > -1) {
              logger.error("Question already loaded: " + id);
            }
            loaded_ids.push(id);
          });
        });
      }
    });
    misc.shuffle(questions);
    var texts = questions.map(function(q) { return q.text; });
  });
});

// reshuffle every 1 minute. this is kind of ridiculous.
setInterval(function() {
  misc.shuffle(questions);
}, 1*60*1000);

// module.exports = function(m, req, res) { R.route(req, res); };
module.exports = function(m, req, res) {
  // don't show them anything they've already seen.
  var ctx = {
    questions: []
  };

  var urlObj = url.parse(req.url, true);
  var workerId = (urlObj.query.workerId || req.user_id).replace(/\W+/g, '');
  req.cookies.set('workerId', workerId);

  models.User.fromId(workerId, function(err, user) {
    for (var question, q = 0, i = 0; (question = questions[q]) && (i < per_page); q++) {
      if (!user || user.seen.indexOf(question.id) === -1) {
        var new_question = _.clone(question, {index: ++i});
        context.questions.push(new_question);
      }
    }

    // 20 hits per page
    context.remaining_hits = (context.remaining / per_page) | 0;
    if (context.assignmentId !== 'ASSIGNMENT_ID_NOT_AVAILABLE')
      context.remaining_hits--;
    amulet.stream(['layout.mu', 'verb-continuation.mu'], context).pipe(res);
  });
};
