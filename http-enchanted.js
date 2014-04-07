/*jslint node: true */
var http = require('http-enhanced');
var logger = require('loge');

http.ServerResponse.prototype.die = function(error) {
  if (this.statusCode == 200) {
    this.statusCode = 500;
  }
  logger.error('res.die:', error.stack, error);
  return this.text(error ? 'Failure: ' + error.toString() : 'Failure');
};

module.exports = http;
