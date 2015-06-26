var _ = require('lodash');
var db = require('../db');

function firstLeaf(tree) {
  if (tree.children.length > 0) {
    return firstLeaf(tree.children[0]);
  }
  return tree;
}

function Block() {

}

Block.shapeTree = function(all_blocks) {
  var block_hash = _.object(all_blocks.map(function(block) {
    block.children = [];
    return [block.id, block];
  }));
  var root_blocks = [];
  all_blocks.forEach(function(block) {
    if (block.parent_block_id) {
      // block_hash and root blocks contents are linked by reference, so order doesn't matter here
      var parent = block_hash[block.parent_block_id];
      block.parent = parent;
      parent.children.push(block);
    }
    else {
      // blocks with no parent_block_id are added to the root list
      root_blocks.push(block);
    }
  });
  return _.sortBy(root_blocks, 'view_order');
};

/**
Searches for the first block that:
1) is in the same experiment
2) has the lowest view_order
3) that's greater than the current block's view_order

callback(Error)                  // unanticipated error
callback(null, block_id: Number) // no error
callback(null, null)             // no more blocks in experiment
*/
Block.nextBlockId = function(experiment_id, participant_id, callback) {
  db.Select('blocks')
  .where('experiment_id = ?', experiment_id)
  .where('id NOT IN (SELECT block_id FROM responses WHERE participant_id = ?)', participant_id)
  .orderBy('view_order ASC')
  .execute(function(err, blocks) {
    if (err) return callback(err);

    if (blocks.length === 0) {
      return callback(null, null);
    }

    var root_blocks = Block.shapeTree(blocks);
    var first_root_block = root_blocks[0];
    var first_block = firstLeaf(first_root_block);
    // check if we need to randomize
    if (first_block.parent && first_block.parent.randomize) {
      var current_parent = first_block.parent;
      var current_blocks = _.shuffle(current_parent.children);
      return callback(null, current_blocks[0].id);
    }
    return callback(null, first_block.id);
  });
};

module.exports = Block;
