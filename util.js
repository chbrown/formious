var crypto = require('crypto');

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

exports.clone = function(original, merge) {
  // SHALLOW!
  // if you specify a merge object, it'll use that as the base.
  // so clone(queston, {index: 5}) is kind of like python's question.update(index=5)
  var copy = merge || {};
  for (var key in original) {
    if (original.hasOwnProperty(key))
      copy[key] = original[key];
  }
  return copy;
};

exports.extend = function(list, other_list) {
  return list.push.apply(list, other_list);
};

exports.repeat = function(item, count) {
  var list = [];
  for (var i = 0; i < count; i++)
    list.push(item);
  return list;
};

exports.md5 = function(string) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(string);
  return md5sum.digest('hex');
};

exports.randRange = function(min, max) {
  if (min === undefined && max === undefined) { min = 0; max = 1; }
  if (max === undefined) { max = min; min = 0; }
  return Math.random() * (max - min) + min;
};
