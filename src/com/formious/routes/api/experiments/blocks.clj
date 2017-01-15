(ns com.formious.routes.api.experiments.blocks
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.block :as Block]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET PATCH POST PUT DELETE context defroutes]]))

; /api/experiments/*
(def routes
  (context "/:experiment_id/blocks" [experiment_id :<< as-int]
    (GET "/" []
      ; list all of an experiment's blocks
      (Block/all experiment_id))
    (GET "/new" []
      (Block/blank))
    (POST "/" {body :body}
      (->> (select-keys body ["template_id" "context" "view_order" "randomize" "parent_block_id" "quota"])
           (Block/insert!)
           (created)))
    (GET "/:id" [id :<< as-int]
      (Block/find-by-id experiment_id id))
    (POST "/:id" [id :<< as-int :as {body :body}]
      (->> (select-keys body ["template_id" "context" "view_order" "randomize" "parent_block_id" "quota"])
           (Block/update! id experiment_id))
      (no-content))
    (DELETE "/:id" [id :<< as-int]
      (Block/delete! id experiment_id)
      (no-content))
    (GET "/tree" []
      ; Special non-REST method to get all blocks and sort them into a tree.
      (-> Block/all Block/buildTree))))
    ; (PUT "/tree"
      ; Special non-REST method to store a tree structure of blocks and in a tree structure.
      ;val putBlockTree: Endpoint[String] = put(int :: "blocks" :: "tree" :: body) { (experiment_id: Int, body: String) =>
      ;  parse(body).flatMap { json => json.as[RootNode[Block]] } match { ; .getOrElse(Json.Null)
      ;    case Xor.Left(failure) =>
      ;      BadRequest(new Exception("Error decoding"))
      ;    case Xor.Right(rootNode) =>
      ;      Block.updateTree(rootNode, experiment_id)
      ;      Ok("Successfully updated block tree")
      ;  }
      ;}
