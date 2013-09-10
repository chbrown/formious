'use strict'; /*jslint node: true, es5: true, indent: 2 */
var moment = require('moment');

exports.parseJSON = function(s) {
  try {
    return JSON.parse(s);
  }
  catch (exc) {
    return exc;
  }
};

exports.durationStringToSeconds = function(s) {
  // takes a string like "5h" and returns 5*60*60, the number of seconds in five hours
  var matches = s.match(/\d+\w/g);
  var duration = moment.duration(0);
  matches.forEach(function(match) {
    var parts = match.match(/(\d+)(\w)/);
    duration.add(parseInt(parts[1], 10), parts[2]);
  });
  return duration.asSeconds();
};

exports.random = function(min, max) {
  /** select a random value between min and max

  * `min` Number lower bound (defaults to 0)
  * `max` Number upper bound (defaults to 1)
  */
  if (min === undefined && max === undefined) { min = 0; max = 1; }
  if (max === undefined) { max = min; min = 0; }
  return Math.random() * (max - min) + min;
};

exports.sample = function(list, num) {
  // with replacement.
  if (num === undefined) {
    // return a single item
    return list[(Math.random() * list.length) | 0];
  }
  else {
    var samples = [];
    for (var i = 0; i < num; i++) {
      samples.push(list[(Math.random() * list.length) | 0]);
    }
    return samples;
  }
};

exports.alphadec = function(length) {
  var store = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += store[(Math.random() * store.length) | 0];
  }
  return result;
};


exports.die404 = function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
};
