var _ = require('lodash');
var async = require('async');
var logger = require('loge');

var db = require('../db');
var tree = require('../lib/tree');

function Block() { }

Block.shapeTree = function(all_blocks) {
  var block_hash = _.object(all_blocks.map(function(block) {
    block.children = [];
    return [block.id, block];
  }));
  var root_blocks = [];
  all_blocks.forEach(function(block) {
    if (block.parent_block_id) {
      // block_hash and root blocks contents are linked by reference, so order doesn't matter here
      block_hash[block.parent_block_id].children.push(block);
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
Block.nextBlockId = function(experiment_id, block_id, participant_id, callback) {
  async.parallel({
    incomplete_blocks: function(callback) {
      db.Select('blocks')
      .where('experiment_id = ?', experiment_id)
      .where('id NOT IN (SELECT block_id FROM responses WHERE participant_id = ?)', participant_id)
      .orderBy('view_order ASC')
      .execute(callback);
    },
    most_recent_block: function(callback) {
      // we need to get the parent_block_id of the most_recent block
      db.SelectOne('blocks')
      .whereEqual({id: block_id})
      .execute(callback);
    },
  }, function(err, results) {
    if (err) return callback(err);

    var incomplete_blocks = results.incomplete_blocks;
    var most_recent_block = results.most_recent_block;

    // should id = null?
    var root = {id: null, children: Block.shapeTree(incomplete_blocks)};
    function findBlock(id) {
      return tree.recursiveFind([root], function(block) {
        return block.id === id;
      });
    }

    // 1. get the path of block ids (only ids, since we mutate the tree when
    //    pruning) from the parent of the most recent block to the root.
    function findPath(block_id) {
      var block = findBlock(block_id);
      if (block.parent_block_id) {
        return [block_id].concat(findPath(block.parent_block_id));
      }
      return [block_id];
    }
    // [parent_of_most_recent, parent_of_that, grandparent_of_most_recent, null]
    var current_path = findPath(most_recent_block.parent_block_id);

    // 2. prune blocks with no children
    function pruneEmptyBlocks(nodes) {
      return nodes.map(function(node) {
        return _.assign({}, node, {children: pruneEmptyBlocks(node.children)});
      }).filter(function(node) {
        return node.template_id || node.children.length > 0;
      });
    }
    root = pruneEmptyBlocks([root])[0];

    // 2.5 if the experiment is totally finished, take the easy-out
    if (root === undefined) {
      return callback(null, null);
    }

    // 3. find the first block in the path that still exists in the active tree
    function firstExistingBlock(block_ids) {
      if (block_ids.length > 0) {
        var block = findBlock(block_ids[0]);
        return block || firstExistingBlock(block_ids.slice(1));
      }
    }
    var next_parent_block = firstExistingBlock(current_path);

    // 4. recurse / randomize as needed
    function findNextBlock(parent_block) {
      // _.sample called with a single argument returns a single item, not a list
      var next_block = (parent_block.randomize ? _.sample : _.first)(parent_block.children);
      // only return blocks with a template_id field
      return next_block.template_id ? next_block.id : findNextBlock(next_block);
    }
    return callback(null, findNextBlock(next_parent_block));
  });
};

module.exports = Block;
