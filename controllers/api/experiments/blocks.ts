import * as _ from 'lodash'
import * as async from 'async'
import {logger} from 'loge'
import Router from 'regex-router'

import db from '../../../db'
import * as httpUtil from '../../../http-util'
import {recursiveEach} from '../../../lib/tree'
import Block, {BlockRow} from '../../../models/Block'

const R = new Router()

/** GET /api/experiments/:experiment_id/blocks
list all of an experiment's blocks */
R.get(/\/api\/experiments\/(\d+)\/blocks$/, (req, res, m) => {
  db.Select('blocks')
  .whereEqual({experiment_id: m[1]})
  .orderBy('view_order')
  .execute((err, blocks) => {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, blocks)
  })
})

/** POST /api/experiments/:experiment_id/blocks
Create new block */
R.post(/\/api\/experiments\/(\d+)\/blocks$/, (req, res, m) => {
  httpUtil.readData(req, (err, data) => {
    if (err) return httpUtil.writeError(res, err)

    const fields = {
      experiment_id: m[1],
      template_id: data.template_id,
      context: data.context,
      view_order: data.view_order,
    }

    db.InsertOne('blocks')
    .set(fields)
    .returning('*')
    .execute((err, block) => {
      if (err) return httpUtil.writeError(res, err)

      res.statusCode = 201
      httpUtil.writeJson(res, block)
    })
  })
})

/** GET /api/experiments/:experiment_id/blocks/:block_id
Create blank block */
R.get(/\/api\/experiments\/(\d+)\/blocks\/new$/, (req, res, m) => {
  // blank block
  httpUtil.writeJson(res, {experiment_id: m[1]})
})

/** GET /api/experiments/:experiment_id/blocks/:block_id
Show block details */
R.get(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, (req, res, m) => {
  db.SelectOne('blocks')
  .whereEqual({experiment_id: m[1], id: m[2]})
  .execute((err, block) => {
    if (err) return httpUtil.writeError(res, err)

    httpUtil.writeJson(res, block)
  })
})

/** POST /api/experiments/:experiment_id/blocks/:block_id
Update existing block
*/
R.post(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, (req, res, m) => {
  httpUtil.readData(req, (err, data) => {
    if (err) return httpUtil.writeError(res, err)

    const fields = _.pick(data, Block.columns)

    db.Update('blocks')
    .setEqual(fields)
    .whereEqual({experiment_id: m[1], id: m[2]})
    .execute((err) => {
      if (err) return httpUtil.writeError(res, err)

      // 204 No content
      res.statusCode = 204
      res.end()
    })
  })
})

/** DELETE /api/experiments/:experiment_id/blocks/:block_id
Delete block
*/
R.delete(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, (req, res, m) => {
  db.Delete('blocks')
  .whereEqual({experiment_id: m[1], id: m[2]})
  .execute((err) => {
    if (err) return httpUtil.writeError(res, err)

    res.statusCode = 204
    res.end() // 204 No content
  })
})

/**
GET /api/experiments/:experiment_id/blocks/tree

Special non-REST method to get all blocks and sort them into a tree.
*/
R.get(/\/api\/experiments\/(\d+)\/blocks\/tree$/, (req, res, m) => {
  const experiment_id = m[1]
  db.Select('blocks')
  .whereEqual({experiment_id})
  .orderBy('view_order')
  .execute((err, all_blocks) => {
    if (err) return httpUtil.writeError(res, err)

    const rootBlocks = Block.shapeTree(all_blocks)
    httpUtil.writeJson(res, rootBlocks)
  })
})

/**
PUT /api/experiments/:experiment_id/blocks/tree

Special non-REST method to store a tree structure of blocks and in a tree structure.
*/
R.put(/\/api\/experiments\/(\d+)\/blocks\/tree$/, (req, res, m) => {
  const experiment_id = m[1]
  httpUtil.readData(req, (err, rootBlocks: BlockRow[]) => {
    if (err) return httpUtil.writeError(res, err)

    // 1. instantiate the missing blocks so that they have id's we can use when flattening
    const newBlocks: BlockRow[] = []
    recursiveEach(rootBlocks, (block) => {
      if (block.id === undefined) {
        newBlocks.push(block)
      }
    })
    async.each(newBlocks, (block, callback) => {
      const fields = _.pick(block, Block.columns)

      db.InsertOne('blocks')
      .set(fields)
      .returning('*')
      .execute((err, full_block) => {
        if (err) return callback(err)
        // update by reference
        _.assign(block, full_block)
        // okay, all blocks should have .id fields now; ready to move on
        callback()
      })
    }, (err: Error) => {
      if (err) return httpUtil.writeError(res, err)

      rootBlocks.forEach((root_block) => {
        root_block.parent_block_id = null
      })
      recursiveEach(rootBlocks, (block) => {
        block.children.forEach((child_block) => {
          child_block.parent_block_id = block.id
        })
      })
      // now the tree structure is defined on each block, and the 'children' links are no longer needed.
      // 2. flatten the rootBlocks-based tree into a flat Array of blocks
      const all_blocks: BlockRow[] = []
      recursiveEach(rootBlocks, (block) => {
        all_blocks.push(block)
      })
      const all_blocks_ids = all_blocks.map((block) => block.id)

      logger.info('Updating %d blocks', all_blocks.length)

      // 3. brute-force update them all
      async.each(all_blocks, (block, callback) => {
        const fields = _.pick(block, Block.columns)

        db.Update('blocks')
        .setEqual(fields)
        .whereEqual({
          // careful, if block.id is null/undefined, this could wreak havoc!
          id: block.id || 0,
        })
        .execute(callback)
      }, (err: Error) => {
        if (err) return httpUtil.writeError(res, err)

        // delete all other blocks
        db.Delete('blocks')
        .whereEqual({experiment_id})
        .where('NOT (id = ANY(?::integer[]))', all_blocks_ids)
        .execute((err) => {
          if (err) return httpUtil.writeError(res, err)

          httpUtil.writeJson(res, {message: 'Successfully updated block tree'})
        })
      })
    })
  })
})

export default R.route.bind(R)
