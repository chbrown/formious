(ns formious.db.block
  (:require [clojure.walk :as walk]
            [clojure.tools.logging :as log]
            [formious.db.response :as Response]
            [era.core :refer [now]]
            [formious.util :refer [as-long]]
            [formious.db :as db]))

; (experiment_id: Int, template_id: Option[Int], context: String,
;   view_order: Double, randomize: Boolean, parent_block_id: Option[Int], quota: Option[Int])
; Int Int Option[Int] String Double Boolean Option[Int] Option[Int] ZonedDateTime
(defrecord Block [id experiment_id template_id context view_order randomize parent_block_id quota created])
(def writable-columns
  ["template_id"
   "context"
   "view_order"
   "randomize"
   "parent_block_id"
   "quota"])

(defn blank
  []
  (Block. nil nil nil "{}" 0 false nil nil (now)))

(defn all
  [experiment_id]
  (->> (db/query ["SELECT * FROM block WHERE experiment_id = ? ORDER BY view_order ASC" (as-long experiment_id)])
       (map map->Block)))

(defn next-in-experiment
  [experiment_id]
  (-> (db/query ["SELECT * FROM block WHERE experiment_id = ? ORDER BY view_order ASC LIMIT 1" (as-long experiment_id)])
      first
      map->Block))

(defn find-by-id
  [experiment_id id]
  (some-> (db/query ["SELECT * FROM block WHERE experiment_id = ? AND id = ?" (as-long experiment_id) (as-long id)])
          first
          map->Block))

(defn insert!
  [row]
  (->> row (db/insert! "block") map->Block))

(defn update!
  ; (id: Int, experiment_id: Int, template_id: Option[Int], context: String, view_order: Double, randomize: Boolean, parent_block_id: Option[Int], quota: Option[Int])
  [id experiment_id set-map]
  (db/update! "block" set-map ["id = ? AND experiment_id = ?" (as-long id) (as-long experiment_id)]))

(defn delete!
  [id experiment_id]
  (db/delete! "block" ["id = ? AND experiment_id = ?" (as-long id) (as-long experiment_id)]))

(defrecord TreeNode [children])
(defrecord BranchNode [children value])
(defrecord RootNode [children])

(defn- get-node-value-id
  [node]
  (get-in node [:value :id]))

(defn- buildBranchNode
  ; Take a root block and build it out into a structured tree,
  ; using children-map to (recursively) find children
  ;
  ; @param parent-block Starting block
  ; @param children-map Mapping from block ID to that block's children (if any)
  ; @return Structured tree
  ; parent-block: Block, children-map: Map[Option[Int], Seq[Block]]): BranchNode[Block]
  [parent-block children-map]
  (let [children (get children-map (:id parent-block) [])
        children-nodes (map #(buildBranchNode % children-map) children)]
    (BranchNode. children parent-block)))

(defn buildTree
  ; (blocks: Seq[Block]): RootNode[Block]
  [blocks]
  (let [children-map (group-by :parent_block_id blocks)
        ; blocks with no parent_block_id are added to the root list
        roots (get children-map nil)
        branches (map #(buildBranchNode % children-map) roots)]
    ; I think branches should be sorted already? maybe not
    (RootNode. (sort-by #(get-in % [:value :view_order]) branches))))

; Generate mapping from block.id to total number of responses for that block
(defn- fetchBlockResponseCounts
  ; blockIds: Seq[Int]): Map[Int, Long]
  [block-ids]
  (let [rows (db/query ["SELECT block_id, COUNT(id) FROM response
                         WHERE block_id = ANY(?)
                         GROUP BY block_id" block-ids])]
    ; TODO: it's possible there are no responses for any of the candidate blocks, so we supply a default
    ; .withDefaultValue(0L)
    (into {} (map (juxt :block_id :count) rows))))

;
; Find the next block that needs to be done. If randomize is false, just take the first of the given blocks.
; If randomize is true, and there is a quota, pick a less-completed (by previous participants) block, otherwise
; just pick a random block.
;
; @param blockNodes A non-empty sequence of Block nodes, which have been already determined to be incomplete.
;                   We have to handle block nodes rather than just Blocks, since we might need to recurse down
;                   to the children, if the selected block is a container (parent).
; @return One of the given blocks
;
(defn sampleBlockNode
  ; (blockNodes: Seq[BranchNode[Block]], randomize: Boolean, quotaOption: Option[Int]): BranchNode[Block]
  [blockNodes randomize quotaOption]
  ; TODO: handle case where quota is true, but randomize is false (does that make any sense, though?)
  (if randomize
    (if quotaOption
      (let [blockResponseCount (fetchBlockResponseCounts (map get-node-value-id blockNodes))
            ; sort by which block has the fewest completions
            sortedBlockNodes (sort-by #(blockResponseCount get-node-value-id) blockNodes)
            ; TODO: randomly sample weighted by missing completions, maybe?
            minimumResponseCount (-> sortedBlockNodes first :value :id blockResponseCount)
            candidateBlockNodes (take-while #(= (blockResponseCount get-node-value-id) minimumResponseCount) sortedBlockNodes)]
        (rand-nth candidateBlockNodes))
      (rand-nth blockNodes))
    (first blockNodes)))

(defn blockNodeQuota
  ; (blockNode: TreeNode[Block]): Int = blockNode match {
  [{:keys [children value]}]
  (if value
    ; case BranchNode(children, value) =>
    (if-let [quota (:quota value)]
      quota
      ; hopefully quota ≤ children.size, because otherwise it wouldn't make sense
      (count children))
    (count children)))

;
; For the given blockNode, which should be pre-determined to have at least one incomplete child block,
; determine the next ...
;
(defn nextPhysicalBlock
  ; (parentBlockNode: TreeNode[Block], completedBlocks: Set[Int]): BranchNode[Block]
  [parentBlockNode completedBlocks]
  (let [incompleteBlockNodes (->> parentBlockNode
                                  :children
                                  (remove #(get completedBlocks (get-node-value-id %))))
        [randomize quota] (if-let [value (:value parentBlockNode)]
                            ; case BranchNode(_, value) =>
                            [(:randomize value) (:quota value)]
                            ; case RootNode(_) =>
                            [false nil])
        childBlockNode (sampleBlockNode incompleteBlockNodes randomize quota)]
    ; 3. recurse downward and randomize as needed. this is recursive since we
    ; may need to query past responses when randomizing
    (if (get-in childBlockNode [:value :template_id])
      ; only return blocks with a template_id field
      childBlockNode
      (nextPhysicalBlock childBlockNode completedBlocks))))

;
; Searches for the first block that:
; 1) is in the same experiment
; 2) has the lowest view_order
; 3) that's greater than the current block's view_order
;
; @return None if there are no more incomplete blocks in experiment,
;         or the next block to be completed if there is one
;
(defn nextBlock
  ; (experiment_id: Int, block_id: Int, participant_id: Int): Option[Block]
  ; TODO: maybe select only the columns we need? I.e., exclude the bulky context
  [experiment_id block_id participant_id]
  (let [blocks    (all experiment_id)
        responses    (Response/whereParticipant participant_id)
        ; set of completed block ids for this participant
        originalCompletedBlocks (set (map get-node-value-id responses))
        rootNode    (buildTree blocks)
        currentBlockNodeOption []];   (rootNode.findFirst(_.id == block_id)
        ; if (currentBlockNodeOption.isEmpty) {
        ;   ; not funny. that block doesn't exist in this experiment.
        ;   logger.debug(s"Block with id=$block_id cannot be found.")
        ; }
    ; we need to get the parent_block_id of the most_recent block
    (mapcat identity currentBlockNodeOption)))
      ; currentBlockNode =>
      ; ; 1. get the path of blocks from the parent of the current block to the root.
      ; val parents = rootNode.parentPath(currentBlockNode)
      ; ; 2. travel upward until we find a parent that has incomplete children,
      ; ;    marking blocks as complete as needed
      ; val (nextParentBlockNodeOption, allCompletedBlocks) = parents.foldLeft((Option.empty[TreeNode[Block]], originalCompletedBlocks)) {
      ;   case ((Some(incompleteBlockNode), completedBlocks), _) =>
      ;     ; quick exit over the remaining parents
      ;     (Some(incompleteBlockNode), completedBlocks)
      ;   case ((None, completedBlocks), parentBlockNode) =>
      ;     ; okay, we haven't yet established that there are any blocks left to do...
      ;     val completed = parentBlockNode.children.count { blockNode => completedBlocks(blockNode.value.id) }
      ;     ; check if the parent block's limit ("quota") has been reached
      ;     val quota = blockNodeQuota(parentBlockNode)
      ;     if (completed >= quota) {
      ;       ; okay, we've completed all there is to complete in this block; mark it complete and keep going up
      ;       parentBlockNode match {
      ;         ; if it's not a pseudo-Node, like the root, that is
      ;         case BranchNode(_, value) =>
      ;           Response.create(participant_id, value.id)
      ;           (None, completedBlocks + value.id)
      ;         case RootNode(_) =>
      ;           (None, completedBlocks)
      ;       }
      ;     }
      ;     else {
      ;       ; welp, this is it, there's something left to do in this block
      ;       (Some(parentBlockNode), completedBlocks)
      ;     }
      ; }
      ; nextParentBlockNodeOption.map { nextParentBlockNode =>
      ;   nextPhysicalBlock(nextParentBlockNode, allCompletedBlocks).value
      ; }

(defn updateTree
  ; (root: TreeNode[Block], experiment_id: Int) {
  ; flatten the structured tree into a flat Array of blocks
  [root experiment_id]
  (let [allBlocks_original [] ; root.flatten.map(_.value)]
          ; 1. instantiate the missing blocks so that they have id's we can use when flattening
        allBlocks []
        all-blocks-ids (map :id allBlocks)] ; allBlocks_original.map { block =>
          ;   if (block.id == 0) {
          ;     Block.create(experiment_id, block.template_id, block.context, block.view_order, block.randomize, block.parent_block_id, block.quota)
          ;   }
          ;   else {
          ;     block
          ;   }
          ; }
    ; okay, all blocks should have .id fields now, ready to move on and fix the structure as needed

    ; TODO: set parent_block_id = null for rootBlocks

    ; TODO: set parent_block_id = the parent's id for the rest of the blocks (persist the tree structure)
    ;childBlock.parent_block_id = block.id

    ; now the tree structure is defined on each block, and the 'children' links are no longer needed.
    ;val allBlockIds = allBlocks.map(_.id)

    (log/info "Updating" (count allBlocks) "blocks")
    ; 3. brute-force: update them all
    (doseq [block allBlocks]
      ; careful, if block.id is null, this could wreak havoc and lose data!
      (update! (:id block) experiment_id (assoc block :experiment_id experiment_id)))
    ; 4. delete all the other blocks
    (db/delete! "block" ["experiment_id = ? AND NOT (id = ANY(?::integer[]))" experiment_id all-blocks-ids])))
