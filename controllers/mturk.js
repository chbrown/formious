/*jslint node: true */
// var formidable = require('formidable');
var models = require('../lib/models');
var amulet = require('amulet');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

// POST /mturk/externalSubmit
R.any(/^\/mturk\/externalSubmit/, function(req, res, m) {
  req.readData(function(err, data) {
    var aws_worker_id = data.workerId || 'WORKER_ID_NOT_AVAILABLE';
    delete data.workerId;
    // null stim_id
    models.Participant.addResponse(aws_worker_id, null, data, function(err, responses) {
      if (err) return res.die(err);

      res.text('Your responses have been submitted and saved.');
    });
  });
});

module.exports = R.route.bind(R);
