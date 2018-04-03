import * as _ from 'lodash'
import * as async from 'async'

import db from '../db'
import {recursiveFind} from '../lib/tree'

export interface Row {
  id: number
  experiment_id: number
  template_id?: number
  context?: any
  view_order: number
  created: Date
  randomize: boolean
  parent_block_id?: number
  quota?: number
}

// tree-built extension
export interface ExtendedRow extends Row {
  children?: ExtendedRow[]
  completed?: Date
  responses?: number
}

export default class Block {
  static columns = [
    'id',
    'experiment_id',
    'template_id',
    'context',
    'view_order',
    'created',
    'randomize',
    'parent_block_id',
    'quota',
  ]

  /**
  shapeTree takes a list of blocks and returns a subset of that list, but where
  all given blocks can be found within the tree structure of each block in that list.
  */
  static shapeTree(blocks: Row[]): ExtendedRow[] {
    const block_hash: {[id: number]: ExtendedRow} = {}
    blocks.forEach(block => {
      // this has to be Object.assign instead of {...block, children: []}
      // since we add children by reference (we don't want a new object)
      block_hash[block.id] = Object.assign(block, {children: []})
    })
    const root_blocks: ExtendedRow[] = []
    blocks.forEach(block => {
      if (block.parent_block_id) {
        // block_hash and root blocks contents are linked by reference, so order doesn't matter here
        block_hash[block.parent_block_id].children.push(block)
      }
      else {
        // blocks with no parent_block_id are added to the root list
        root_blocks.push(block)
      }
    })
    // I think these should be sorted already? maybe not
    return _.sortBy(root_blocks, 'view_order')
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
  static nextBlockId(experiment_id: number,
                     block_id: number,
                     participant_id: number,
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
    `, [participant_id, experiment_id], (err, blocks: Row[]) => {
      if (err) return callback(err)

      // should id = null?
      const root: ExtendedRow = {
        id: null,
        experiment_id,
        view_order: -1,
        created: new Date(),
        randomize: false,
        children: Block.shapeTree(blocks),
      }
      function findBlock(id: number): ExtendedRow {
        return recursiveFind([root], block => block.id === id)
      }

      // we need to get the parent_block_id of the most_recent block
      const most_recent_block = findBlock(block_id)
      if (most_recent_block === undefined) {
        // not funny. that block doesn't exist in this experiment.
        return callback(new Error(`Block with id=${block_id} cannot be found.`))
      }

      // 1. get the path of block ids (only ids, since we mutate the tree when
      //    pruning) from the parent of the most recent block to the root.
      /**
      Returns a list from nearest to root, e.g.:
          [parent_of_most_recent, grandparent_of_most_recent, ..., null]
      */
      function findPath(current_block_id: number): ExtendedRow[] {
        const block = findBlock(current_block_id)
        if (block.parent_block_id) {
          return [block].concat(findPath(block.parent_block_id))
        }
        return [block, root]
      }
      const current_path = findPath(most_recent_block.parent_block_id)

      // 2. travel upward until we find a parent that has incomplete children,
      //    marking blocks for completion as needed
      async.whilst<Error>(() => {
        const next_parent_block = current_path[0]
        if (next_parent_block === root) {
          return false
        }
        const completed_children = next_parent_block.children.filter(block => !!block.completed)

        if (completed_children.length == next_parent_block.children.length) {
          return true
        }
        // check if the parent block's limit ("quota") has been reached
        if (next_parent_block.quota && completed_children.length >= next_parent_block.quota) {
          return true
        }
        return false
      }, whilstCallback => {
        // okay, we're done with that block, shift it off
        const block = current_path.shift()
        // mark it completed locally, so that parent blocks will see it's been completed
        block.completed = new Date() // doesn't really matter what date, actually
        // and then persist the completion, too
        db.InsertOne('responses')
        .set({
          participant_id,
          block_id: block.id,
          // value: null,
        })
        .execute(whilstCallback)
      }, (err) => {
        if (err) return callback(err)
        // ok, current_path is either empty or current_path[0] is the next block we should do
        const initial_next_parent_block = current_path[0];

        // 3. recurse downward and randomize as needed. this is async since we
        // may need to query past responses when randomizing
        (function next(next_parent_block: Row) {
          nextChildBlock(next_parent_block, (ncbError, next_block) => {
            if (ncbError) return callback(ncbError)

            // if there are no more blocks to do, next_block will be null
            if (next_block === null) {
              return callback(null, null)
            }
            // only return blocks with a template_id field
            if (next_block.template_id) {
              callback(null, next_block.id)
            }
            else {
              next(next_block)
            }
          })
        })(initial_next_parent_block)
      })
    })
  }
}

function nextChildBlock(parent_block: ExtendedRow, callback: (error: Error, block?: Row) => void) {
  const incomplete_child_blocks = parent_block.children.filter(block => !block.completed)
  // if next_parent_block was `root` all the children might be completed
  if (incomplete_child_blocks.length === 0) {
    // so, we've completed all there is to complete!
    return callback(null, null)
  }
  if (parent_block.randomize) {
    if (parent_block.quota !== null) {
      const incomplete_child_block_ids = incomplete_child_blocks.map(block => block.id)
      // find the next candidate that has the fewest completions
      db.Select('responses')
      .add('block_id, COUNT(id)::int')
      .where('block_id = ANY(?)', incomplete_child_block_ids)
      .groupBy('block_id')
      .execute((err, counts: Array<{block_id: number, count: number}>) => {
        if (err) return callback(err)
        const block_counts: {[index: number]: number} = _.zipObject(counts.map(count => [count.block_id, count.count]))
        // it's possible there are no responses for any of the candidate blocks
        incomplete_child_blocks.forEach(block => {
          block.responses = block_counts[block.id] || 0
        })
        const minimum_count: number = _.min(incomplete_child_blocks.map(block => block.responses))
        const candidate_child_blocks = incomplete_child_blocks.filter(block => block.responses == minimum_count)
        //
        const next_block = _.sample(candidate_child_blocks)
        callback(null, next_block)
      })
    }
    else {
      setImmediate(() => {
        // _.sample called with a single argument returns a single item, not a list
        const next_block = _.sample(incomplete_child_blocks)
        callback(null, next_block)
      })
    }
  }
  else {
    setImmediate(() => {
      const next_block = incomplete_child_blocks[0]
      callback(null, next_block)
    })
  }
}
