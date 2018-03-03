var _ = require('lodash')
var async = require('async')
var {logger} = require('loge')
var Router = require('regex-router')

var Block = require('../../../models/Block')
var db = require('../../../db')
var tree = require('../../../lib/tree')

var R = new Router()

/** GET /api/experiments/:experiment_id/blocks
list all of an experiment's blocks */
R.get(/\/api\/experiments\/(\d+)\/blocks$/, function(req, res, m) {
  db.Select('blocks')
  .whereEqual({experiment_id: m[1]})
  .orderBy('view_order')
  .execute(function(err, blocks) {
    if (err) return res.die(err)

    res.json(blocks)
  })
})

/** POST /api/experiments/:experiment_id/blocks
Create new block */
R.post(/\/api\/experiments\/(\d+)\/blocks$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err)

    var fields = {
      experiment_id: m[1],
      template_id: data.template_id,
      context: data.context,
      view_order: data.view_order,
    }

    db.InsertOne('blocks')
    .set(fields)
    .returning('*')
    .execute(function(err, block) {
      if (err) return res.die(err)

      res.status(201).json(block)
    })
  })
})

/** GET /api/experiments/:experiment_id/blocks/:block_id
Create blank block */
R.get(/\/api\/experiments\/(\d+)\/blocks\/new$/, function(req, res, m) {
  // blank block
  res.json({experiment_id: m[1]})
})

/** GET /api/experiments/:experiment_id/blocks/:block_id
Show block details */
R.get(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, function(req, res, m) {
  db.SelectOne('blocks')
  .whereEqual({experiment_id: m[1], id: m[2]})
  .execute(function(err, block) {
    if (err) return res.die(err)
    res.json(block)
  })
})

/** POST /api/experiments/:experiment_id/blocks/:block_id
Update existing block
*/
R.post(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, function(req, res, m) {
  req.readData(function(err, data) {
    if (err) return res.die(err)

    var fields = _.pick(data, Block.columns)

    db.Update('blocks')
    .setEqual(fields)
    .whereEqual({experiment_id: m[1], id: m[2]})
    .execute(function(err) {
      if (err) return res.die(err)
      // 204 No content
      res.status(204).end()
    })
  })
})

/** DELETE /api/experiments/:experiment_id/blocks/:block_id
Delete block
*/
R.delete(/\/api\/experiments\/(\d+)\/blocks\/(\d+)$/, function(req, res, m) {
  db.Delete('blocks')
  .whereEqual({experiment_id: m[1], id: m[2]})
  .execute(function(err) {
    if (err) return res.die(err)
    res.status(204).end() // 204 No content
  })
})

/**
GET /api/experiments/:experiment_id/blocks/tree

Special non-REST method to get all blocks and sort them into a tree.
*/
R.get(/\/api\/experiments\/(\d+)\/blocks\/tree$/, function(req, res, m) {
  var experiment_id = m[1]
  db.Select('blocks')
  .whereEqual({experiment_id: experiment_id})
  .orderBy('view_order')
  .execute(function(err, all_blocks) {
    if (err) return res.die(err)

    var root_blocks = Block.shapeTree(all_blocks)
    res.json(root_blocks)
  })
})

/**
PUT /api/experiments/:experiment_id/blocks/tree

Special non-REST method to store a tree structure of blocks and in a tree structure.
*/
R.put(/\/api\/experiments\/(\d+)\/blocks\/tree$/, function(req, res, m) {
  var experiment_id = m[1]
  req.readData(function(err, root_blocks) {
    if (err) return res.die(err)

    // 1. instantiate the missing blocks so that they have id's we can use when flattening
    var new_blocks = []
    tree.recursiveEach(root_blocks, function(block) {
      if (block.id === undefined) {
        new_blocks.push(block)
      }
    })
    async.each(new_blocks, function(block, callback) {
      var fields = _.pick(block, Block.columns)

      db.InsertOne('blocks')
      .set(fields)
      .returning('*')
      .execute(function(err, full_block) {
        if (err) return callback(err)
        // update by reference
        _.assign(block, full_block)
        // okay, all blocks should have .id fields now; ready to move on
        callback()
      })
    }, function(err) {
      if (err) return res.die(err)
      root_blocks.forEach(function(root_block) {
        root_block.parent_block_id = null
      })
      tree.recursiveEach(root_blocks, function(block) {
        block.children.forEach(function(child_block) {
          child_block.parent_block_id = block.id
        })
      })
      // now the tree structure is defined on each block, and the 'children' links are no longer needed.
      // 2. flatten the root_blocks-based tree into a flat Array of blocks
      var all_blocks = []
      tree.recursiveEach(root_blocks, function(block) {
        all_blocks.push(block)
      })
      var all_blocks_ids = all_blocks.map(function(block) {
        return block.id
      })

      logger.info('Updating %d blocks', all_blocks.length)

      // 3. brute-force update them all
      async.each(all_blocks, function(block, callback) {
        var fields = _.pick(block, Block.columns)


        db.Update('blocks')
        .setEqual(fields)
        .whereEqual({
          // careful, if block.id is null/undefined, this could wreak havoc!
          id: block.id || 0,
        })
        .execute(callback)
      }, function(err) {
        if (err) return res.die(err)

        // delete all other blocks
        db.Delete('blocks')
        .whereEqual({experiment_id: experiment_id})
        .where('NOT (id = ANY(?::integer[]))', all_blocks_ids)
        .execute(function(err) {
          if (err) return res.die(err)

          res.json({message: 'Successfully updated block tree'})
        })
      })
    })
  })
})

module.exports = R.route.bind(R)
