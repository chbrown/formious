/*jslint node: true */
var crypto = require('crypto');

var salt = process.env.npm_config_salt || require('../package').config.salt;

exports.sha256 = function(string) {
  var shasum = crypto.createHash('sha256');
  shasum.update(salt, 'utf8');
  shasum.update(string, 'utf8');
  return shasum.digest('hex');
};
