(ns formious.db.participant
  (:require [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn all
  []
  (db/query "SELECT * FROM participant ORDER BY id ASC"))

(defn insert!
  [row]
  (db/insert! "participant" row))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM participant WHERE id = ?" (as-long id)])))

(defn update!
  [id set-map]
  (db/update! "participant" set-map ["id = ?" (as-long id)]))
