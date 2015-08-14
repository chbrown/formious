var logger = require('loge').logger;
var streaming = require('streaming');
var sv = require('sv');

/**
Return a WritableStream, which we will generally pipe into res, and then
successively write() to, eventually calling end(), or pipe to from another stream.

Handles ?accept= querystring values as well as Accept: headers, deferring to
the querystring, and defaults to line-delimited JSON

TODO: refactor into http-enhanced, somehow.
*/
function createTransform(accept) {
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
  writable_stream.content_type = content_type;
  return writable_stream;
}
exports.createTransform = createTransform;
