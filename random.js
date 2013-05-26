'use strict'; /*jslint node: true, es5: true, indent: 2 */

exports.shuffle = function(list) {
  // careful! shuffles in place (and returns given list)
  // for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  for (var i, tmp, j = list.length - 1; j > 0; j--) {
    i = Math.random() * (j + 1) | 0;
    tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
};

exports.sample = function(list, num) {
  // with replacement.
  if (num === undefined) {
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

exports.range = function(min, max) {
  if (min === undefined && max === undefined) { min = 0; max = 1; }
  if (max === undefined) { max = min; min = 0; }
  return Math.random() * (max - min) + min;
};
