/*jslint node: true */
var logger = require('loge');
var Router = require('regex-router');
var streaming = require('streaming');
var sv = require('sv');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

/** POST /api/sv
parse csv-like input flexibly and write out json to response */
R.post('/api/sv', function(req, res, m) {
  // /^\/sv(.json)?$/
  var parser = req.pipe(new sv.Parser());
  streaming.readToEnd(parser, function(err, rows) {
    if (err) return res.die(err);

    logger.debug('/api/sv: finished reading %d rows of %d columns', rows.length, parser.columns.length);

    // columns is a list of strings, rows is a list of objects
    res.json({columns: parser.columns, rows: rows});
  });
});

