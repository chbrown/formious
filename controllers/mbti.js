'use strict'; /*jslint node: true, es5: true, indent: 2 */
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var _ = require('underscore');
var amulet = require('amulet');

var logger = require('../lib/logger');
var misc = require('../lib/misc');
var models = require('../lib/models');

var mbti = [];
fs.readFile(path.join(__dirname, 'mbti.yaml'), 'utf8', function(err, mbti_yaml) {
  yaml.loadAll(mbti_yaml, function(stimuli) {
    stimuli.forEach(function(stimulus, index) {
      mbti.push({text: stimulus, id: index});
    });
    misc.shuffle(mbti);
  });
});

module.exports = function(req, res, m) {
  var ctx = {
    questions: mbti.map(function(question, i) {
      var cloned_question = _.clone(question);
      cloned_question.index = i + 1;
      return cloned_question;
    })
  };

  amulet.stream(['layout.mu', 'mbti.mu'], ctx).pipe(res);
};
