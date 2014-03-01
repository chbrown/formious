/*jslint node: true */
var formidable = require('formidable');
var models = require('../lib/models');
var amulet = require('amulet');
var Router = require('regex-router');

var R = new Router(function(req, res) {
  res.die(404, 'No resource at: ' + req.url);
});

// POST /mturk/externalSubmit
R.post(/^\/mturk\/externalSubmit/, function(req, res, m) {
  new formidable.IncomingForm().parse(req, function(err, fields) {
    var aws_worker_id = fields.workerId;
    delete fields.workerId;
    // null stim_id
    models.Participant.addResponse(aws_worker_id, null, fields, function(err, responses) {
      if (err) return res.die(err);

      amulet.stream(['layout.mu', 'done.mu'], {}).pipe(res);
      // res.json({message: 'Inserted responses'});
    });
  });
});

module.exports = R.route.bind(R);
