/*jslint node: true */
var logger = require('loge');
var Router = require('regex-router');
var streaming = require('streaming');
var sv = require('sv');

var excel = require('../lib/excel');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

var parseSvStream = function(readable, callback) {
  // callback: function(Error, {columns: [String], rows: [Object]})
  var parser = readable.pipe(new sv.Parser());
  streaming.readToEnd(parser, function(err, rows) {
    if (err) return callback(err);

    // columns is a list of strings, rows is a list of objects
    callback(null, {columns: parser.columns || [], rows: rows});
  });
};

/** POST /api/table
parse csv-like input flexibly and write out json to response */
R.post('/api/table', function(req, res) {
  var content_type = req.headers['content-type'];
  if (content_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    req.readToEnd(function(err, data) {
      var result = excel.parse(data);
      // result is already a {columns: [String], rows: [Object]} object
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

// R.post(/^\/addbonus$/, function(req, res, m) {
//   var default_bonus = 0.25;
//   var max_bonus = 0.25;
//   // var unpaid_minimum = 49;
//   new formidable.IncomingForm().parse(req, function(err, fields, files) {
//     var workerId = fields.workerId || req.user_id;
//     models.User.fromId(workerId, function(err, user) {
//       if (err) return res.die('User query error: ' + err);
//       if (!user) return res.die('No user "' + workerId + '" found.');

//       var amount = Math.min(parseFloat(fields.amount || default_bonus), max_bonus);
//       var previous_bonus_owed = user.bonus_owed;

//       user.bonus_owed = previous_bonus_owed + amount;
//       user.save(function(err) {
//         if (err) {
//           logger.error(err);
//           res.json({success: false, message: 'Error assigning bonus: ' + err.toString(), amount: amount});
//         }
//         else {
//           logger.info('User bonus_owed increased from ' + previous_bonus_owed +
//             ' by ' + amount + ' to ' + (previous_bonus_owed + amount) + '.');
//           res.json({success: true, message: 'Bonus awarded: $' + amount, amount: amount});
//         }
//       });
//     });
//   });
// });

module.exports = R.route.bind(R);
