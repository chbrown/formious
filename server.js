var http = require('http-enhanced');
var logger = require('loge').logger;
var controllers = require('./controllers');

http.ServerResponse.prototype.die = function(error) {
  if (this.statusCode == 200) {
    this.statusCode = 500;
  }
  var message = error ? error.stack : 'Failure';
  return this.text(message);
};

var streaming = require('streaming');
var url = require('url');
var sv = require('sv');

/**
Return a WritableStream, which we will generally pipe into res, and then
successively write() to, eventually calling end(), or pipe to from another stream.

Handles ?accept= querystring values as well as Accept: headers, deferring to
the querystring, and defaults to line-delimited JSON

TODO: refactor into http-enhanced, somehow.
*/
http.IncomingMessage.prototype.createWriter = function() {
  // this = req;
  var urlObj = url.parse(this.url, true);
  var accept = urlObj.query.accept || this.headers.accept || 'application/json; boundary=LF';
  // set empty content_type and no-op stream
  var content_type = null;
  // set default to streaming.json.Stringifier() so that we don't trip up on
  // "TypeError: Invalid non-string/buffer chunk" errors when trying to write
  // an object to the default writer
  var writable_stream = new streaming.json.Stringifier();
  // now check that header against the accept values we support
  if (accept.match(/application\/json;\s*boundary=(NL|LF|EOL)/)) {
    content_type = 'application/json; boundary=LF';
    writable_stream = new streaming.json.Stringifier();
  }
  else if (accept.match(/application\/json/)) {
    content_type = 'application/json';
    writable_stream = new streaming.json.ArrayStringifier();
  }
  else if (accept.match(/text\/csv/)) {
    content_type = 'text/csv; charset=utf-8';
    writable_stream = new sv.Stringifier({peek: 100});
  }
  else if (accept.match(/text\/plain/)) {
    content_type = 'text/plain; charset=utf-8';
    writable_stream = new sv.Stringifier({peek: 100});
  }
  else {
    // new streaming.Sink({objectMode: true});
    // res.status(406).error(error, req.headers);
    logger.info('Cannot find writer for Accept value: %j; using default', accept);
  }
  // hijack the pipe function so that we can call setHeader on whatever we're piping to.
  writable_stream._pipe = writable_stream.pipe;
  writable_stream.pipe = function(res) {
    if (content_type) {
      res.setHeader('Content-Type', content_type);
    }
    return this._pipe(res);
  };
  return writable_stream;
};

module.exports = http.createServer(function(req, res) {
  logger.debug('%s %s', req.method, req.url);
  controllers(req, res);
})
.on('listening', function() {
  var address = this.address();
  logger.info('server listening on http://%s:%d', address.address, address.port);
});
