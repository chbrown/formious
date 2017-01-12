(ns com.formious.db.administrator
  (:require [com.formious.db :as db]
            [com.formious.common :as common])
  (:import [java.time ZonedDateTime]))

(defrecord Block
  ; Int Int Option[Int] String Double Boolean Option[Int] Option[Int] ZonedDateTime
  [id experiment_id template_id context view_order randomize parent_block_id quota created])

; case class BlockData(template_id: Option[Int], context: String, view_order: Double, randomize: Boolean, parent_block_id: Option[Int], quota: Option[Int])

(defn row->Block
  [row]
  (-> row (update :created .toZonedDateTime) map->Block))

(defn blank
  []
  (Block. nil "{}" 0.0 false nil nil))

(defn all
  [experiment_id]
  (->> (db/query ["SELECT * FROM block WHERE experiment_id = ? ORDER BY view_order ASC" experiment_id])
       (map row->Block)))

(defn next
  [experiment_id]
  (-> (db/query ["SELECT * FROM block WHERE experiment_id = ? ORDER BY view_order ASC LIMIT 1" experiment_id])
      first
      row->Block))

(defn find
  [experiment_id id]
  (-> (db/query ["SELECT * FROM block WHERE experiment_id = ? AND id = ?" experiment_id id])
      first
      row->Block))

(defn insert!
  ; (experiment_id: Int, template_id: Option[Int], context: String, view_order: Double, randomize: Boolean, parent_block_id: Option[Int], quota: Option[Int])
  [row]
  (->> row (db/insert! "block") row->AWSAccountAdministrator))

(defn update!
  ; (id: Int, experiment_id: Int, template_id: Option[Int], context: String, view_order: Double, randomize: Boolean, parent_block_id: Option[Int], quota: Option[Int])
  [id set-map]
  (db/update! "block" set-map ["id = ?" id]))

(defn delete!
  [id experiment_id]
  (db/delete! "block" ["id = ? AND experiment_id = ?" id experiment_id]))

; (defn- buildBranchNode
;   ; Take a root block and build it out into a structured tree,
;   ; using childrenMap to (recursively) find children
;   ;
;   ; @param parentBlock Starting block
;   ; @param childrenMap Mapping from block ID to that block's children (if any)
;   ; @return Structured tree
;   ; parentBlock: Block, childrenMap: Map[Option[Int], Seq[Block]]): BranchNode[Block]
;   [parent-block children-map]
;   children = childrenMap(Some(parentBlock.id)).map { block =>
;       buildBranchNode(block, childrenMap)
;     }
;     BranchNode(children, parentBlock)

; (defn buildTree
;   ; (blocks: Seq[Block]): RootNode[Block]
;   [blocks]
;     val childrenMap = blocks.groupBy(_.parent_block_id)
;     ; blocks with no parent_block_id are added to the root list
;     val branches = childrenMap(None).map { rootBlock =>
;       buildBranchNode(rootBlock, childrenMap)
;     }.sortBy(_.value.view_order) ; I think these should be sorted already? maybe not
;     RootNode(branches)

; ; Generate mapping from block.id to total number of responses for that block
; (defn- fetchBlockResponseCounts(blockIds: Seq[Int]): Map[Int, Long]
;   val blockIdCountPairs = query("
;     SELECT block_id, COUNT(id) FROM response
;       WHERE block_id = ANY(?)
;       GROUP BY block_id
;   ", blockIds) { row => row.getInt("block_id") -> row.getLong("count") }
;   ; it's possible there are no responses for any of the candidate blocks, so we supply a default
;   blockIdCountPairs.toMap.withDefaultValue(0L)
; }

; ;
; ; Find the next block that needs to be done. If randomize is false, just take the first of the given blocks.
; ; If randomize is true, and there is a quota, pick a less-completed (by previous participants) block, otherwise
; ; just pick a random block.
; ;
; ; @param blockNodes A non-empty sequence of Block nodes, which have been already determined to be incomplete.
; ;                   We have to handle block nodes rather than just Blocks, since we might need to recurse down
; ;                   to the children, if the selected block is a container (parent).
; ; @return One of the given blocks
; ;
; def sampleBlockNode(blockNodes: Seq[BranchNode[Block]], randomize: Boolean, quotaOption: Option[Int]): BranchNode[Block]
;   ; TODO: handle case where quota is true, but randomize is false (does that make any sense, though?)
;   if (randomize) {
;     quotaOption match {
;       case Some(quota) =>
;         val blockResponseCount = fetchBlockResponseCounts(blockNodes.map(_.value.id))
;         ; sort by which block has the fewest completions
;         val sortedBlockNodes = blockNodes.sortBy(blockNode => blockResponseCount(blockNode.value.id))
;         ; TODO: randomly sample weighted by missing completions, maybe?
;         val minimumResponseCount = blockResponseCount(sortedBlockNodes.head.value.id)
;         val candidateBlockNodes = sortedBlockNodes.takeWhile { blockNode =>
;           blockResponseCount(blockNode.value.id) == minimumResponseCount
;         }
;         (rand-nth candidateBlockNodes)
;       case None =>
;         (rand-nth blockNodes)
;     }
;   }
;   else {
;     blockNodes.head
;   }
; }

; def blockNodeQuota(blockNode: TreeNode[Block]): Int = blockNode match {
;   case BranchNode(children, value) =>
;     value.quota match {
;       case Some(quota) => quota
;       ; hopefully quota ≤ children.size, because otherwise it wouldn't make sense
;       case None => children.size
;     }
;   case RootNode(children) =>
;     children.size
; }

; ;
; ; For the given blockNode, which should be pre-determined to have at least one incomplete child block,
; ; determine the next ...
; ;
; def nextPhysicalBlock(parentBlockNode: TreeNode[Block], completedBlocks: Set[Int]): BranchNode[Block]
;   val incompleteBlockNodes = parentBlockNode.children.filterNot { blockNode =>
;     completedBlocks(blockNode.value.id)
;   }
;   val (randomize, quota) = parentBlockNode match {
;     case BranchNode(_, value) => (value.randomize, value.quota)
;     case RootNode(_) => (false, None)
;   }
;   val childBlockNode = sampleBlockNode(incompleteBlockNodes, randomize, quota)
;   ; 3. recurse downward and randomize as needed. this is recursive since we
;   ; may need to query past responses when randomizing
;   childBlockNode.value.template_id match {
;     ; only return blocks with a template_id field
;     case Some(_) => childBlockNode
;     case None => nextPhysicalBlock(childBlockNode, completedBlocks)
;   }
; }

; ;
; ; Searches for the first block that:
; ; 1) is in the same experiment
; ; 2) has the lowest view_order
; ; 3) that's greater than the current block's view_order
; ;
; ; @return None if there are no more incomplete blocks in experiment,
; ;         or the next block to be completed if there is one
; ;
; def nextBlock(experiment_id: Int, block_id: Int, participant_id: Int): Option[Block]
;   ; TODO: maybe select only the columns we need? I.e., exclude the bulky context
;   val blocks = Block.all(experiment_id)
;   val responses = Response.whereParticipant(participant_id)
;   /** set of completed block ids for this participant */
;   val originalCompletedBlocks = responses.map(_.block_id).toSet

;   val rootNode = buildTree(blocks)
;   val currentBlockNodeOption = rootNode.findFirst(_.id == block_id)
;   if (currentBlockNodeOption.isEmpty) {
;     ; not funny. that block doesn't exist in this experiment.
;     logger.debug(s"Block with id=$block_id cannot be found.")
;   }
;   ; we need to get the parent_block_id of the most_recent block
;   currentBlockNodeOption.flatMap { currentBlockNode =>
;     ; 1. get the path of blocks from the parent of the current block to the root.
;     val parents = rootNode.parentPath(currentBlockNode)
;     ; 2. travel upward until we find a parent that has incomplete children,
;     ;    marking blocks as complete as needed
;     val (nextParentBlockNodeOption, allCompletedBlocks) = parents.foldLeft((Option.empty[TreeNode[Block]], originalCompletedBlocks)) {
;       case ((Some(incompleteBlockNode), completedBlocks), _) =>
;         ; quick exit over the remaining parents
;         (Some(incompleteBlockNode), completedBlocks)
;       case ((None, completedBlocks), parentBlockNode) =>
;         ; okay, we haven't yet established that there are any blocks left to do...
;         val completed = parentBlockNode.children.count { blockNode => completedBlocks(blockNode.value.id) }
;         ; check if the parent block's limit ("quota") has been reached
;         val quota = blockNodeQuota(parentBlockNode)
;         if (completed >= quota) {
;           ; okay, we've completed all there is to complete in this block; mark it complete and keep going up
;           parentBlockNode match {
;             ; if it's not a pseudo-Node, like the root, that is
;             case BranchNode(_, value) =>
;               Response.create(participant_id, value.id)
;               (None, completedBlocks + value.id)
;             case RootNode(_) =>
;               (None, completedBlocks)
;           }
;         }
;         else {
;           ; welp, this is it, there's something left to do in this block
;           (Some(parentBlockNode), completedBlocks)
;         }
;     }
;     nextParentBlockNodeOption.map { nextParentBlockNode =>
;       nextPhysicalBlock(nextParentBlockNode, allCompletedBlocks).value
;     }
;   }
; }

; def updateTree(root: TreeNode[Block], experiment_id: Int) {
;   ; flatten the structured tree into a flat Array of blocks
;   val allBlocks_original = root.flatten.map(_.value)

;   ; 1. instantiate the missing blocks so that they have id's we can use when flattening
;   val allBlocks = allBlocks_original.map { block =>
;     if (block.id == 0) {
;       Block.create(experiment_id, block.template_id, block.context, block.view_order, block.randomize, block.parent_block_id, block.quota)
;     }
;     else {
;       block
;     }
;   }
;   ; okay, all blocks should have .id fields now, ready to move on and fix the structure as needed

;   ; TODO: set parent_block_id = null for rootBlocks

;   ; TODO: set parent_block_id = the parent's id for the rest of the blocks (persist the tree structure)
;   ;childBlock.parent_block_id = block.id

;   ; now the tree structure is defined on each block, and the 'children' links are no longer needed.
;   ;val allBlockIds = allBlocks.map(_.id)

;   logger.debug(s"Updating ${allBlocks.size} blocks")

;   ; 3. brute-force: update them all
;   allBlocks.foreach { block =>
;     ; careful, if block.id is null, this could wreak havoc and lose data!
;     Block.update(block.id,
;       experiment_id,
;       block.template_id,
;       block.context,
;       block.view_order,
;       block.randomize,
;       block.parent_block_id,
;       block.quota)
;   }
;   ; 4. delete all the other blocks
;   execute("
;     DELETE FROM block
;     WHERE experiment_id = ?
;       AND NOT (id = ANY(?::integer[]))
;   ", List(experiment_id, allBlocks.map(_.id)))
