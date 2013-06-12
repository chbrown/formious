'use strict'; /*jslint node: true, es5: true, indent: 2 */

exports.parseJSON = function(s) {
  try {
    return JSON.parse(s);
  }
  catch (exc) {
    return exc;
  }
};

exports.randRange = function(min, max) {
  if (min === undefined && max === undefined) { min = 0; max = 1; }
  if (max === undefined) { max = min; min = 0; }
  return Math.random() * (max - min) + min;
};
