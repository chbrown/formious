/*jslint node: true */
var logger = require('loge');
var Router = require('regex-router');
var streaming = require('streaming');
var sv = require('sv');
var _ = require('underscore');
var models = require('../../lib/models');

var excel = require('../../lib/excel');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

R.any(/^\/api\/access_tokens/, require('./access_tokens'));
R.any(/^\/api\/administrators/, require('./administrators'));
R.any(/^\/api\/aws_accounts/, require('./aws_accounts'));
R.any(/^\/api\/experiments/, require('./experiments'));
R.any(/^\/api\/mturk/, require('./mturk'));
R.any(/^\/api\/participants/, require('./participants'));
R.any(/^\/api\/templates/, require('./templates'));

var parseSvStream = function(readable, callback) {
  // callback: function(Error, {columns: [String], rows: [Object]})
  var parser = readable.pipe(new sv.Parser());
  streaming.readToEnd(parser, function(err, rows) {
    if (err) return callback(err);

    // columns is a list of strings, rows is a list of objects
    callback(null, {columns: parser.columns || [], rows: rows});
  });
};

function useHeaders(rows) {
  // convert from flat table to list of objects using the first row in rows
  var columns = rows[0];
  var data = rows.slice(1).map(function(cells) {
    var pairs = _.zip(columns, cells);
    return _.object(pairs);
  });
  return {
    columns: columns,
    rows: data,
  };
}

/** POST /api/table
parse csv-like input flexibly and write out json to response */
R.post('/api/table', function(req, res) {
  var content_type = req.headers['content-type'];
  if (content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    req.readToEnd(function(err, data) {
      var table = excel.parse(data);
      var result = useHeaders(table);
      // result is now a {columns: [String], rows: [Object]} object
      res.json(result);
    });
  }
  else {
    parseSvStream(req, function(err, result) {
      logger.debug('/api/table: finished reading sv: %d rows, %d columns',
        result.rows.length, result.columns.length);

      // var columns = ;
      res.json(result);
    });
  }
});

module.exports = function(req, res) {
  // require administrator privileges
  var token = req.cookies.get('administrator_token');
  models.Administrator.fromToken(token, function(err, administrator) {
    if (err) {
      res.status(401).die('Authorization failed; you must login first.');
    }
    else {
      // authentication succeeded!
      req.administrator = administrator;
      req.ctx = {current_user: administrator};
      R.route(req, res);
    }
  });
};
