(ns formious.db.experiment
  (:require [formious.db.accesstoken :as accesstoken]
            [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn all
  []
  (db/query "SELECT * FROM experiment ORDER BY id ASC"))

(defn insert!
  [row]
  (db/insert! "experiment" row))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM experiment WHERE id = ?" (as-long id)])))

(defn find-or-create-accesstoken!
  [id & {:keys [length expires]
         :or   {length 12}}]
  (accesstoken/find-or-create! "experiments" (as-long id) length expires))

(defn update!
  [id set-map]
  (db/update! "experiment" set-map ["id = ?" (as-long id)]))
