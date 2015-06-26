var Router = require('regex-router');
var db = require('../../db');
var url = require('url');

var R = new Router();

/**
GET /api/responses
*/
R.get(/^\/api\/responses(\?|$)/, function(req, res) {
  var urlObj = url.parse(req.url, true);

  // set a maximum limit at 1000, but default it to 250
  var limit = Math.min(urlObj.query.limit || 250, 1000);

  var select = db.Select('responses, participants, blocks')
  .where('participants.id = responses.participant_id')
  .where('blocks.id = responses.block_id')
  .add([
    '*',
    // 'id' and 'created' from the other tables conflict with responses
    'responses.id AS id',
    'responses.created AS created',
    // count how many responses there are in all (i.e., outside the LIMIT)
    'COUNT(responses.id) OVER() AS count',
  ])
  .orderBy('responses.created DESC')
  .limit(limit);

  if (urlObj.query.aws_worker_id) {
    select = select.whereEqual({
      aws_worker_id: urlObj.query.aws_worker_id
    });
  }

  select.execute(function(err, responses) {
    if (err) return res.die(err);
    res.ngjson(responses);
  });
});

/**
GET /api/responses/:id
*/
R.get(/^\/api\/responses\/(\d+)$/, function(req, res, m) {
  db.SelectOne('responses')
  .whereEqual({id: m[1]})
  .execute(function(err, response) {
    if (err) return res.die(err);
    res.json(response);
  });
});

module.exports = R.route.bind(R);
