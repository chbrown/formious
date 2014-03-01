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
R.post('/api/sv', function(req, res) {
  // /^\/sv(.json)?$/
  var parser = req.pipe(new sv.Parser());
  streaming.readToEnd(parser, function(err, rows) {
    if (err) return res.die(err);

    logger.debug('/api/sv: finished reading %d rows of %d columns',
      rows.length, parser.columns.length);

    // columns is a list of strings, rows is a list of objects
    res.json({columns: parser.columns, rows: rows});
  });
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
