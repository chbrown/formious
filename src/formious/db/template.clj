(ns formious.db.template
  (:require [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn all
  []
  (db/query "SELECT * FROM template ORDER BY id ASC"))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM template WHERE id = ?" (as-long id)])))

(defn insert!
  [row]
  (db/insert! "template" row))

(defn update!
  [id set-map]
  (db/update! "template" set-map ["id = ?" (as-long id)]))

(defn delete!
  [id]
  (db/delete! "template" ["id = ?" (as-long id)]))
