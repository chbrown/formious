package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class Block(id: Int,
                 experiment_id: Int,
                 template_id: Option[Int],
                 context: String,
                 view_order: Double,
                 randomize: Boolean,
                 parent_block_id: Option[Int],
                 quota: Option[Int],
                 created: ZonedDateTime)

object Block extends SQLSyntaxSupport[Block] {
  override val tableName = "block"

  def apply(rs: WrappedResultSet) = new Block(
    rs.get("id"),
    rs.get("experiment_id"),
    rs.get("template_id"),
    rs.get("context"),
    rs.get("view_order"),
    rs.get("randomize"),
    rs.get("parent_block_id"),
    rs.get("quota"),
    rs.get("created"))

  def empty = new Block(0, 0, None, "{}", 0.0, false, None, None, ZonedDateTime.now)

  val select = (experiment_id: Int) =>
    sql"SELECT * FROM block WHERE experiment_id = $experiment_id ORDER BY view_order ASC"

  def all(experiment_id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    select(experiment_id).map(Block(_)).list.apply()
  }

  def next(experiment_id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    select(experiment_id).map(Block(_)).single.apply()
  }

  def find(experiment_id: Int, id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM block WHERE experiment_id = $experiment_id AND id = $id".map(Block(_)).single.apply().get
  }

  def insert(template_id: Option[Int],
             context: String,
             view_order: Double,
             randomize: Boolean,
             parent_block_id: Option[Int],
             quota: Option[Int])(implicit session: DBSession) = {
    withSQL {
      insertInto(Block).namedValues(
        Block.column.template_id -> template_id,
        Block.column.context -> context,
        Block.column.view_order -> view_order,
        Block.column.randomize -> randomize,
        Block.column.parent_block_id -> parent_block_id,
        Block.column.quota -> quota
      ).append(sqls"RETURNING *")
    }.map(Block(_)).single.apply().get
  }

  def update(id: Int,
             template_id: Option[Int],
             context: String,
             view_order: Double,
             randomize: Boolean,
             parent_block_id: Option[Int],
             quota: Option[Int])(implicit session: DBSession) = {
    withSQL {
      scalikejdbc.update(Block).set(
        Block.column.template_id -> template_id,
        Block.column.context -> context,
        Block.column.view_order -> view_order,
        Block.column.randomize -> randomize,
        Block.column.parent_block_id -> parent_block_id,
        Block.column.quota -> quota
      ).where.eq(Block.column.id, id)
    }.update.apply()
  }

  /**
    * Take a root block and build it out into a structured tree,
    * using childrenMap to (recursively) find children
    *
    * @param parentBlock Starting block
    * @param childrenMap Mapping from block ID to that block's children (if any)
    * @return Structured tree
    */
  private def buildBranchNode(parentBlock: Block, childrenMap: Map[Option[Int], List[Block]]): BranchNode[Block] = {
    val children = childrenMap(Some(parentBlock.id)).map { block =>
      buildBranchNode(block, childrenMap)
    }
    BranchNode(children, parentBlock)
  }

  def buildTree(blocks: List[Block]): RootNode[Block] = {
    val childrenMap = blocks.groupBy(_.parent_block_id)
    // blocks with no parent_block_id are added to the root list
    val branches = childrenMap(None).map { rootBlock =>
      buildBranchNode(rootBlock, childrenMap)
    }.sortBy(_.value.view_order) // I think these should be sorted already? maybe not
    RootNode(branches)
  }

  private def sampleOne[T](xs: Seq[T]): T = {
    val idx = scala.util.Random.nextInt(xs.size)
    xs(idx)
  }

  /**
    * Find the next block that needs to be done. If randomize is false, just take the first of the given blocks.
    * If randomize is true, and there is a quota, pick a less-completed (by previous participants) block, otherwise
    * just pick a random block.
    *
    * @param blockNodes A non-empty sequence of Block nodes, which have been already determined to be incomplete.
    *                   We have to handle block nodes rather than just Blocks, since we might need to recurse down
    *                   to the children, if the selected block is a container (parent).
    * @return One of the given blocks
    */
  def sampleBlockNode(blockNodes: Seq[BranchNode[Block]], randomize: Boolean, quotaOption: Option[Int])
                     (implicit session: DBSession = ReadOnlyAutoSession): BranchNode[Block] = {
    // TODO: handle case where quota is true, but randomize is false (does that make any sense, though?)
    if (randomize) {
      quotaOption match {
        case Some(quota) =>

          /** Mapping from block.id to total number of responses for that block */
          val blockIds = blockNodes.map(_.value.id)
          val blockResponseCountPairs = sql"""
              SELECT block_id, COUNT(id) FROM response
              WHERE block_id = ANY($blockIds)
              GROUP BY block_id
            """.map(rs => rs.get[Int]("block_id") -> rs.get[Long]("count")).list.apply()
          // it's possible there are no responses for any of the candidate blocks, so we supply a default
          val blockResponseCount = blockResponseCountPairs.toMap.withDefaultValue(0L)
          // sort by which block has the fewest completions
          val sortedBlockNodes = blockNodes.sortBy(blockNode => blockResponseCount(blockNode.value.id))
          // TODO: randomly sample weighted by missing completions, maybe?
          val minimumResponseCount = blockResponseCount(sortedBlockNodes.head.value.id)
          val candidateBlockNodes = sortedBlockNodes.takeWhile { blockNode =>
            blockResponseCount(blockNode.value.id) == minimumResponseCount
          }
          sampleOne(candidateBlockNodes)
        case None =>
          sampleOne(blockNodes)
      }
    }
    else {
      blockNodes.head
    }
  }

  def blockNodeQuota(blockNode: TreeNode[Block]): Int = blockNode match {
    case BranchNode(children, value) =>
      value.quota match {
        case Some(quota) => quota
        // hopefully quota ≤ children.size, because otherwise it wouldn't make sense
        case None => children.size
      }
    case RootNode(children) =>
      children.size
  }

  /**
    * For the given blockNode, which should be pre-determined to have at least one incomplete child block,
    * determine the next ...
    */
  def nextPhysicalBlock(parentBlockNode: TreeNode[Block], completedBlocks: Set[Int])
                       (implicit session: DBSession = ReadOnlyAutoSession): BranchNode[Block] = {
    val incompleteBlockNodes = parentBlockNode.children.filterNot { blockNode =>
      completedBlocks(blockNode.value.id)
    }
    val childBlockNode = parentBlockNode match {
      case BranchNode(_, value) =>
        sampleBlockNode(incompleteBlockNodes, value.randomize, value.quota)
      case RootNode(_) =>
        sampleBlockNode(incompleteBlockNodes, false, None)
    }
    // 3. recurse downward and randomize as needed. this is recursive since we
    // may need to query past responses when randomizing
    childBlockNode.value.template_id match {
      // only return blocks with a template_id field
      case Some(_) => childBlockNode
      case None => nextPhysicalBlock(childBlockNode, completedBlocks)
    }
  }

  /**
    * Searches for the first block that:
    * 1) is in the same experiment
    * 2) has the lowest view_order
    * 3) that's greater than the current block's view_order
    *
    * @return None if there are no more incomplete blocks in experiment,
    *         or the next block to be completed if there is one
    */
  def nextBlock(experiment_id: Int, block_id: Int, participant_id: Int)
               (implicit session: DBSession): Option[Block] = {
    // TODO: maybe select only the columns we need? I.e., exclude the bulky context
    val blocks = Block.all(experiment_id)
    val responses = Response.whereParticipant(participant_id)
    /** set of completed block ids for this participant */
    val originalCompletedBlocks = responses.map(_.block_id).toSet

    val rootNode = buildTree(blocks)
    val currentBlockNodeOption = rootNode.findFirst(_.id == block_id)
    if (currentBlockNodeOption.isEmpty) {
      // not funny. that block doesn't exist in this experiment.
      Console.err.println(s"Block with id=$block_id cannot be found.")
    }
    // we need to get the parent_block_id of the most_recent block
    currentBlockNodeOption.flatMap { currentBlockNode =>
      // 1. get the path of blocks from the parent of the current block to the root.
      val parents = rootNode.parentPath(currentBlockNode)
      // 2. travel upward until we find a parent that has incomplete children,
      //    marking blocks as complete as needed
      val (nextParentBlockNodeOption, allCompletedBlocks) = parents.foldLeft((Option.empty[TreeNode[Block]], originalCompletedBlocks)) {
        case ((Some(incompleteBlockNode), completedBlocks), _) =>
          // quick exit over the remaining parents
          (Some(incompleteBlockNode), completedBlocks)
        case ((None, completedBlocks), parentBlockNode) =>
          // okay, we haven't yet established that there are any blocks left to do...
          val completed = parentBlockNode.children.count { blockNode => completedBlocks(blockNode.value.id) }
          // check if the parent block's limit ("quota") has been reached
          val quota = blockNodeQuota(parentBlockNode)
          if (completed >= quota) {
            // okay, we've completed all there is to complete in this block; mark it complete and keep going up
            parentBlockNode match {
              // if it's not a pseudo-Node, like the root, that is
              case BranchNode(_, value) =>
                Response.insert(participant_id, value.id)
                (None, completedBlocks + value.id)
              case RootNode(_) =>
                (None, completedBlocks)
            }
          }
          else {
            // welp, this is it, there's something left to do in this block
            (Some(parentBlockNode), completedBlocks)
          }
      }
      nextParentBlockNodeOption.map { nextParentBlockNode =>
        nextPhysicalBlock(nextParentBlockNode, allCompletedBlocks).value
      }
    }
  }

  def updateTree(root: TreeNode[Block], experiment_id: Int)
                (implicit session: DBSession) {
    // flatten the structured tree into a flat Array of blocks
    val allBlocks_original = root.flatten.map(_.value)

    // 1. instantiate the missing blocks so that they have id's we can use when flattening
    val allBlocks = allBlocks_original.map { block =>
      if (block.id == 0) {
        Block.insert(block.template_id, block.context, block.view_order, block.randomize, block.parent_block_id, block.quota)
      }
      else {
        block
      }
    }
    // okay, all blocks should have .id fields now, ready to move on and fix the structure as needed

    // TODO: set parent_block_id = null for rootBlocks

    // TODO: set parent_block_id = the parent's id for the rest of the blocks (persist the tree structure)
    //childBlock.parent_block_id = block.id

    // now the tree structure is defined on each block, and the 'children' links are no longer needed.
    //val allBlockIds = allBlocks.map(_.id)

    Console.err.println(s"Updating ${allBlocks.size} blocks")

    // 3. brute-force: update them all
    allBlocks.foreach { block =>
      // careful, if block.id is null, this could wreak havoc and lose data!
      Block.update(block.id,
        block.template_id,
        block.context,
        block.view_order,
        block.randomize,
        block.parent_block_id,
        block.quota)
    }

    // 4. delete all the other blocks
    sql"""
      DELETE FROM block
      WHERE experiment_id = $experiment_id
        AND NOT (id = ANY(${allBlocks.map(_.id)}::integer[]))
    """.update.apply()
  }
}

