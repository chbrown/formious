(ns formious.resources.blocks
  (:require [formious.db.block :as Block]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [multi-defaults single-defaults]]))

(defresource blocks multi-defaults
  :handle-ok (fn [ctx]
               ; list all of an experiment's blocks
               (Block/all (:experiment_id ctx)))
  :post! (fn [ctx]
           (-> ctx :request :body
               (select-keys Block/writable-columns)
               (assoc :experiment_id (:experiment_id ctx))
               Block/insert!)))

(defresource block single-defaults
  :exists? (fn [ctx]
             (when-let [block (if (= (:id ctx) "new")
                                (Block/blank)
                                (Block/find-by-id (:experiment_id ctx) (:id ctx)))]
               {:record block}))
  :handle-ok :record
  :put! (fn [ctx]
          (-> ctx :request :body
              (select-keys Block/writable-columns)
              (Block/update! (:id ctx) (:experiment_id ctx))))
  :delete! (fn [ctx]
             (Block/delete! (:id ctx) (:experiment_id ctx))))

(defresource block-tree single-defaults
  ; Special non-REST method to get all blocks and sort them into a tree.
  :exists? (fn [ctx]
             {:tree (Block/buildTree (Block/all))})
  :handle-ok :tree
  ; Special non-REST method to store a tree structure of blocks and in a tree structure.
  :put! (fn [ctx]
          (-> ctx :request :body
             ; Ok("Successfully updated block tree")
              (Block/updateTree))))
