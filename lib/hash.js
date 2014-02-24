/*jslint node: true */
var crypto = require('crypto');

var SALT = 'rNxROdgCbAkBI2WvZJtH';

exports.sha256 = function(s) {
  var shasum = crypto.createHash('sha256');
  shasum.update(SALT, 'utf8');
  shasum.update(s, 'utf8');
  return shasum.digest('hex');
};
