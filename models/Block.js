/// <reference path="../type_declarations/index.d.ts" />
var _ = require('lodash');
var async = require('async');
var loge_1 = require('loge');
var db = require('../db');
var tree = require('../lib/tree');
var Block = (function () {
    function Block() {
    }
    /**
    shapeTree takes a list of blocks and returns a subset of that list, but where
    all given blocks can be found within the tree structure of each block in that list.
    */
    Block.shapeTree = function (blocks) {
        var block_hash = _.object(blocks.map(function (block) {
            block.children = [];
            return [block.id, block];
        }));
        var root_blocks = [];
        blocks.forEach(function (block) {
            if (block.parent_block_id) {
                // block_hash and root blocks contents are linked by reference, so order doesn't matter here
                block_hash[block.parent_block_id].children.push(block);
            }
            else {
                // blocks with no parent_block_id are added to the root list
                root_blocks.push(block);
            }
        });
        // I think these should be sorted already? maybe not
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
    Block.nextBlockId = function (experiment_id, block_id, participant_id, callback) {
        db.query("SELECT blocks.*, participant_responses.created AS completed FROM blocks\n      LEFT OUTER JOIN (SELECT DISTINCT ON (block_id) * FROM responses WHERE responses.participant_id = $1)\n        AS participant_responses ON participant_responses.block_id = blocks.id\n      WHERE blocks.experiment_id = $2\n      ORDER BY view_order ASC\n    ", [participant_id, experiment_id], function (err, blocks) {
            if (err)
                return callback(err);
            loge_1.logger.info('nextBlockId: experiment_id=%j block_id=%j participant_id=%j', experiment_id, block_id, participant_id);
            // logger.info('blocks: %s', JSON.stringify(blocks, null, '  '));
            // should id = null?
            var root = {
                id: null,
                randomize: false,
                children: Block.shapeTree(blocks),
            };
            function findBlock(id) {
                return tree.recursiveFind([root], function (block) {
                    return block.id === id;
                });
            }
            // we need to get the parent_block_id of the most_recent block
            var most_recent_block = findBlock(block_id);
            if (most_recent_block === undefined) {
                // not funny. that block doesn't exist in this experiment.
                return callback(new Error("Block with id=" + block_id + " cannot be found."));
            }
            // var current_parent_block_id = most_recent_block.parent_block_id;
            loge_1.logger.info('most_recent_block: %j', most_recent_block);
            // 1. get the path of block ids (only ids, since we mutate the tree when
            //    pruning) from the parent of the most recent block to the root.
            /**
            Returns a list from nearest to root, e.g.:
                [parent_of_most_recent, grandparent_of_most_recent, ..., null]
            */
            function findPath(block_id) {
                var block = findBlock(block_id);
                if (block.parent_block_id) {
                    return [block].concat(findPath(block.parent_block_id));
                }
                return [block, root];
            }
            var current_path = findPath(most_recent_block.parent_block_id);
            // 2. travel upward until we find a parent that has incomplete children,
            //    marking blocks for completion as needed
            async.whilst(function () {
                var next_parent_block = current_path[0];
                if (next_parent_block === root) {
                    return false;
                }
                loge_1.logger.info('next_parent_block id=%j', next_parent_block.id);
                var completed_children = next_parent_block.children.filter(function (block) { return !!block.completed; });
                loge_1.logger.info('next_parent_block children.length=%d completed_children.length=%d quota=%d', next_parent_block.children.length, completed_children.length, next_parent_block.quota);
                if (completed_children.length == next_parent_block.children.length) {
                    return true;
                }
                // check if the parent block's limit ("quota") has been reached
                if (next_parent_block.quota && completed_children.length >= next_parent_block.quota) {
                    return true;
                }
                return false;
            }, function (callback) {
                // okay, we're done with that block, shift it off
                var block = current_path.shift();
                // mark it completed locally, so that parent blocks will see it's been completed
                block.completed = new Date(); // doesn't really matter what date, actually
                // and then persist the completion, too
                db.InsertOne('responses')
                    .set({
                    participant_id: participant_id,
                    block_id: block.id,
                })
                    .execute(callback);
            }, function (error) {
                if (error)
                    return callback(error);
                // ok, current_path is either empty or current_path[0] is the next block we should do
                var next_parent_block = current_path[0];
                loge_1.logger.info('after whilst next_parent_block id=%j', next_parent_block);
                // 3. recurse downward and randomize as needed
                function findNextBlock(parent_block) {
                    var incomplete_children_blocks = parent_block.children.filter(function (block) { return !block.completed; });
                    // if next_parent_block was `root` all the children might be completed
                    if (incomplete_children_blocks.length === 0) {
                        // so, we've completed all there is to complete!
                        return null;
                    }
                    var next_block;
                    if (parent_block.randomize) {
                        // _.sample called with a single argument returns a single item, not a list
                        next_block = _.sample(incomplete_children_blocks);
                    }
                    else {
                        next_block = _.first(incomplete_children_blocks);
                    }
                    // only return blocks with a template_id field
                    return next_block.template_id ? next_block.id : findNextBlock(next_block);
                }
                var next_block_id = findNextBlock(next_parent_block);
                return callback(null, next_block_id);
            });
        });
    };
    return Block;
})();
module.exports = Block;
