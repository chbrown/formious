var _ = require('lodash');
var Router = require('regex-router');
var db = require('../../../db');

var R = new Router();

var blocks_columns = ['experiment_id', 'parent_block_id', 'randomize', 'template_id', 'context', 'view_order', 'created'];

/** GET /api/experiments/:experiment_id/blocks
list all of an experiment's blocks */
R.get(/\/api\/experiments\/(\d+)\/blocks$/, function(req, res, m) {
  db.Select('blocks')
  .whereEqual({experiment_id: m[1]})
  .orderBy('view_order')
  .execute(function(err, blocks) {
    if (err) return res.die(err);

    res.ngjson(blocks);
  });
});

/** POST /api/experiments/:experiment_id/blocks
Create new block */
R.post(/\/api\/experiments\/(\d+)\/blocks$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = {
      experiment_id: m[1],
      template_id: data.template_id,
      context: data.context,
      view_order: data.view_order,
    };

    db.Insert('blocks')
    .set(fields)
    .returning('*')
    .execute(function(err, rows) {
      if (err) return res.die(err);

      res.status(201).json(rows[0]);
    });
  });
});

/** GET /api/experiments/:experiment_id/blocks/:block_id
Create blank block */
R.get(/\/api\/experiments\/(\d+)\/blocks\/new$/, function(req, res, m) {
  // blank block
  res.json({experiment_id: m[1]});
});

/** GET /api/experiments/:experiment_id/blocks/:block_id
Show block details */
R.get(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, function(req, res, m) {
  db.SelectOne('blocks')
  .whereEqual({experiment_id: m[1], id: m[2]})
  .execute(function(err, block) {
    if (err) return res.die(err);
    res.json(block);
  });
});

/** POST /api/experiments/:experiment_id/blocks/:block_id
Update existing block
*/
R.post(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, blocks_columns);

    db.Update('blocks')
    .setEqual(fields)
    .whereEqual({experiment_id: m[1], id: m[2]})
    .execute(function(err) {
      if (err) return res.die(err);
      // 204 No content
      res.status(204).end();
    });
  });
});

/** DELETE /api/experiments/:experiment_id/blocks/:block_id
Delete block
*/
R.delete(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, function(req, res, m) {
  db.Delete('blocks')
  .whereEqual({experiment_id: m[1], id: m[2]})
  .execute(function(err) {
    if (err) return res.die(err);
    res.status(204).end(); // 204 No content
  });
});

module.exports = R.route.bind(R);
