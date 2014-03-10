/*jslint node: true */
var http = require('http-enhanced');
var url = require('url');
var querystring = require('querystring');
var util = require('util');
var logger = require('loge');
var amulet = require('amulet');

http.ServerResponse.prototype.adapt = function(req, ctx, templates) {
  // try to flexibly determine the desired content type
  var content_type = 'html';
  if (req.headers.accept.match(/application\/json/)) {
    content_type = 'json';
  }
  else if (req.url.match(/.json$/)) {
    content_type = 'json';
  }

  // okay, now adapt and respond accordingly
  if (content_type == 'json') {
    this.json(ctx);
  }
  else { // assume html
    amulet.stream(templates, req.ctx).pipe(this);
  }
};

http.ServerResponse.prototype.die = function(http_code, err) { // function(/*, error_args... */) {
  // if only one argument is specified, it must be the error string
  // var error_args = Array.prototype.slice.call(arguments, 0);
  // var err = util.format.apply(util, arguments);
  if (err === undefined && isNaN(http_code)) {
    err = http_code;
    http_code = 500;
  }

  if (err) {
    // var err_deep = util.inspect(err, {showHidden: true, depth: 2});
    logger.error('res.die:', err.stack, err);
  }
  var str = err ? 'Failure: ' + err.toString() : 'Failure';
  this.writeAll(http_code, 'text/plain', str);
};

module.exports = http;
