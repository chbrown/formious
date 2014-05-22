/*jslint node: true */
var models = require('../lib/models');
var amulet = require('amulet');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

// POST /mturk/externalSubmit
R.any(/^\/mturk\/externalSubmit/, function(req, res, m) {
  // readData uses the querystring for GET data
  req.readData(function(err, data) {
    var aws_worker_id = data.workerId || 'WORKER_ID_NOT_AVAILABLE';
    delete data.workerId;

    // potentially null stim_id
    var stim_id = data.stim_id || null;
    delete data.stim_id;

    models.Participant.addResponse({
      aws_worker_id: aws_worker_id,
      ip_address: req.headers['x-real-ip'] || req.client.remoteAddress,
      user_agent: req.headers['user-agent'],
    }, {
      stim_id: stim_id,
      value: data,
    }, function(err, responses) {
      if (err) return res.die(err);

      res.text('Your responses have been submitted and saved.');
    });
  });
});

// R.post(/^\/addbonus$/, function(req, res, m) {
//   var default_bonus = 0.25;
//   var max_bonus = 0.25;
//   // var unpaid_minimum = 49;
//   new formidable.IncomingForm().parse(req, function(err, fields, files) {
//     var workerId = fields.workerId || req.user_id;
//     models.User.one({id: workerId}, function(err, user) {
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
