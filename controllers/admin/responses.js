var sv = require('sv');

// GET /admin/responses.tsv (obsolete)
auth_R.get('/admin/responses.tsv', function(req, res) {
  var stringifier = new sv.Stringifier({delimiter: '\t'});
  res.writeHead(200, {'Content-Type': 'text/plain'});
  stringifier.pipe(res);

  var user_stream = models.User.find({
    workerId: /^A/,
    responses: {$ne: []},
  }).sort('-created').stream();

  // flattenArrayProperty(r, 'reliabilities', 'reliability');
  // flattenArrayProperty(r, 'judgments', 'judgment');
  user_stream.on('data', function(user) {
    user.responses.forEach(function(response) {
      // ISO8601-ify dates
      for (var key in response) {
        if (response[key] instanceof Date) {
          response[key] = response[key].toISOString().replace(/\..+$/, '');
        }
      }
      stringifier.write(response);
    });
  });
  user_stream.on('error', function(err) {
    logger.error('User stream error', err);
  });
  user_stream.on('close', function() {
    stringifier.end();
  });
});
// GET /admin/responses/:page.json (obsolete)
auth_R.get(/\/admin\/responses\/(\d+)\.json/, function(req, res, m) {
  var page = parseInt(m[1], 10);
  var per_page = 10;
  var query = models.User
    .find({responses: {$ne: []}})
    .skip(page*per_page)
    .limit(per_page)
    .sort('-created');
  query.exec(function(err, users) {
    var responses = [].concat(_.pluck(users, 'responses'));
    res.json(responses);
  });
});
