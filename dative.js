'use strict'; /*jslint nomen: true, node: true, indent: 2, debug: true, vars: true, es5: true */
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var __ = require('underscore');
var logger = require('./logger');
var util = require('./util');

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
    util.shuffle(questions);
    var texts = questions.map(function(q) { return q.text; });
  });
});

// reshuffle every 1 minute. this is kind of ridiculous.
setInterval(function() {
  util.shuffle(questions);
}, 1*60*1000);

function renderVerbs(req, res, user, context) {
  // don't show them anything they've already seen.
  context.questions = [];
  for (var question, q = 0, i = 0; (question = questions[q]) && (i < per_page); q++) {
    if (!user || user.seen.indexOf(question.id) === -1) {
      var new_question = __.clone(question, {index: ++i});
      context.questions.push(new_question);
    }
  }

  // 20 hits per page
  context.remaining_hits = (context.remaining / per_page) | 0;
  if (context.assignmentId !== 'ASSIGNMENT_ID_NOT_AVAILABLE')
    context.remaining_hits--;
  amulet.render(res, ['layout.mu', 'verb-continuation.mu'], context);
}

var mbti = [];
fs.readFile(path.join(__dirname, 'mbti.yaml'), 'utf8', function (err, mbti_yaml) {
  yaml.loadAll(mbti_yaml, function(stimuli) {
    stimuli.forEach(function(stimulus, index) {
      mbti.push({text: stimulus, id: index});
    });
    util.shuffle(mbti);
  });
});

function renderMbti(req, res, user, context) {
  context.questions = mbti.map(function(question, i) {
    var cloned_question = __.clone(question);
    cloned_question.index = i + 1;
    return cloned_question;
  });

  amulet.render(res, ['layout.mu', 'mbti.mu'], context);
}
