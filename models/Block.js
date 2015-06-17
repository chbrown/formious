var sqlorm = require('./sqlorm');
var db = require('../db');

var Block = exports.Block = sqlorm.createModel(db, 'blocks',
  ['experiment_id', 'template_id', 'context', 'view_order', 'created']);
Block.nextBlockId = function(experiment_id, block_id, callback) {
  /** Searches for the first block that:
  1) is in the same experiment
  2) has the lowest view_order
  3) that's greater than the current block's view_order

  callback(Error)                  // unanticipated error
  callback(null, block_id: Number) // no error
  callback(null, null)             // no more blocks in experiment
  */
  Block.one({id: block_id}, function(err, block) {
    if (err) return callback(err);

    // uses singleton DB
    db.Select('blocks')
    .where('experiment_id = ?', experiment_id)
    .where('view_order > ?', block.view_order)
    .orderBy('view_order ASC')
    .limit(1)
    .execute(function(err, blocks) {
      if (err) return callback(err);
      callback(null, blocks.length ? blocks[0].id : null);
    });
  });
};

module.exports = Block;
