/// <reference path="../type_declarations/index.d.ts" />
import _ = require('lodash');
import async = require('async');
import {logger} from 'loge';

var db = require('../db');
var tree = require('../lib/tree');

interface BlockRow {
  id: number;
  // experiment_id?: number;
  template_id?: number;
  // context?: string;
  randomize: boolean;
  quota?: number;
  parent_block_id?: number;
  view_order?: number;
  // created?: Date;
  // enhancements
  children?: BlockRow[];
  completed?: Date;
  responses?: number;
}

class Block {
  /**
  shapeTree takes a list of blocks and returns a subset of that list, but where
  all given blocks can be found within the tree structure of each block in that list.
  */
  static shapeTree(blocks: BlockRow[]): BlockRow[] {
    var block_hash: {[index: number]: BlockRow} = _.object(blocks.map(block => {
      block.children = [];
      return [block.id, block];
    }));
    var root_blocks: BlockRow[] = [];
    blocks.forEach(block => {
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
  }

  /**
  Searches for the first block that:
  1) is in the same experiment
  2) has the lowest view_order
  3) that's greater than the current block's view_order

  callback(Error)                  // unanticipated error
  callback(null, block_id: Number) // no error
  callback(null, null)             // no more blocks in experiment
  */
  static nextBlockId(experiment_id: number, block_id: number, participant_id: number,
                     callback: (error: Error, block_id?: number) => void) {
    // this query is fast in the database (like 3ms) but can take much longer in javascript (like 25ms)
    // if we're requesting the whole block row, with its bulky context, so we
    // only select the columns we need
    db.query(`SELECT blocks.id, blocks.template_id, blocks.template_id, blocks.randomize, blocks.quota,
        blocks.parent_block_id, blocks.view_order, participant_responses.created AS completed FROM blocks
      LEFT OUTER JOIN (SELECT DISTINCT ON (block_id) * FROM responses WHERE responses.participant_id = $1)
        AS participant_responses ON participant_responses.block_id = blocks.id
      WHERE blocks.experiment_id = $2
      ORDER BY view_order ASC
    `, [participant_id, experiment_id], (err, blocks: BlockRow[]) => {
      if (err) return callback(err);

      // should id = null?
      var root = {
        id: null,
        randomize: false,
        children: Block.shapeTree(blocks),
      };
      function findBlock(id: number): BlockRow {
        return tree.recursiveFind([root], block => block.id === id);
      }

      // we need to get the parent_block_id of the most_recent block
      var most_recent_block = findBlock(block_id);
      if (most_recent_block === undefined) {
        // not funny. that block doesn't exist in this experiment.
        return callback(new Error(`Block with id=${block_id} cannot be found.`));
      }
      // var current_parent_block_id = most_recent_block.parent_block_id;

      // 1. get the path of block ids (only ids, since we mutate the tree when
      //    pruning) from the parent of the most recent block to the root.
      /**
      Returns a list from nearest to root, e.g.:
          [parent_of_most_recent, grandparent_of_most_recent, ..., null]
      */
      function findPath(block_id: number): BlockRow[] {
        var block = findBlock(block_id);
        if (block.parent_block_id) {
          return [block].concat(findPath(block.parent_block_id));
        }
        return [block, root];
      }
      var current_path = findPath(most_recent_block.parent_block_id);

      // 2. travel upward until we find a parent that has incomplete children,
      //    marking blocks for completion as needed
      async.whilst(() => {
        var next_parent_block = current_path[0];
        if (next_parent_block === root) {
          return false;
        }
        var completed_children = next_parent_block.children.filter(block => !!block.completed);

        if (completed_children.length == next_parent_block.children.length) {
          return true;
        }
        // check if the parent block's limit ("quota") has been reached
        if (next_parent_block.quota && completed_children.length >= next_parent_block.quota) {
          return true;
        }
        return false;
      }, callback => {
        // okay, we're done with that block, shift it off
        var block = current_path.shift();
        // mark it completed locally, so that parent blocks will see it's been completed
        block.completed = new Date(); // doesn't really matter what date, actually
        // and then persist the completion, too
        db.InsertOne('responses')
        .set({
          participant_id: participant_id,
          block_id: block.id,
          // value: null,
        })
        .execute(callback);
      }, error => {
        if (error) return callback(error);
        // ok, current_path is either empty or current_path[0] is the next block we should do
        var next_parent_block = current_path[0];

        // 3. recurse downward and randomize as needed. this is async since we
        // may need to query past responses when randomizing
        // var next_parent_block = next_parent_block;
        // var next_block_id = findNextBlock(next_parent_block);
        // async.whilst(() => {
        (function next(next_parent_block: BlockRow) {
          nextChildBlock(next_parent_block, (error, next_block) => {
            if (error) return callback(error);

            // if there are no more blocks to do, next_block will be null
            if (next_block === null) {
              return callback(null, null);
            }
            // only return blocks with a template_id field
            if (next_block.template_id) {
              callback(null, next_block.id);
            }
            else {
              next(next_block);
            }
          });
        })(next_parent_block);
      });
    });
  }
}

function nextChildBlock(parent_block: BlockRow, callback: (error: Error, block?: BlockRow) => void) {
  var incomplete_child_blocks = parent_block.children.filter(block => !block.completed);
  // if next_parent_block was `root` all the children might be completed
  if (incomplete_child_blocks.length === 0) {
    // so, we've completed all there is to complete!
    return callback(null, null);
  }
  if (parent_block.randomize) {
    if (parent_block.quota !== null) {
      var incomplete_child_block_ids = incomplete_child_blocks.map(block => block.id);
      // find the next candidate that has the fewest completions
      db.Select('responses')
      .add('block_id, COUNT(id)::int')
      .where('block_id = ANY(?)', incomplete_child_block_ids)
      .groupBy('block_id')
      .execute((error: Error, counts: {block_id: number, count: number}[]) => {
        if (error) return callback(error);
        var block_counts: {[index: number]: number} = _.zipObject(counts.map(count => [count.block_id, count.count]));
        // it's possible there are no responses for any of the candidate blocks
        incomplete_child_blocks.forEach(block => {
          block.responses = block_counts[block.id] || 0;
        });
        var minimum_count: number = _.min(incomplete_child_blocks.map(block => block.responses));
        var candidate_child_blocks = incomplete_child_blocks.filter(block => block.responses == minimum_count);
        //
        var next_block = _.sample(candidate_child_blocks);
        callback(null, next_block);
      });
    }
    else {
      setImmediate(() => {
        // _.sample called with a single argument returns a single item, not a list
        var next_block = _.sample(incomplete_child_blocks);
        callback(null, next_block);
      });
    }
  }
  else {
    setImmediate(() => {
      var next_block = _.first(incomplete_child_blocks);
      callback(null, next_block);
    });
  }
}

export = Block;
