(ns formious.db.experiment
  (:require [formious.db.accesstoken :as AccessToken]
            [era.core :refer [now]]
            [formious.util :refer [as-long]]
            [formious.db :as db]))

; Int String Int String ZonedDateTime
(defrecord Experiment [id name administrator_id html created])
(def writable-columns
  ["name"
   "administrator_id"
   "html"])

(defn blank
  []
  (Experiment. "new" "" nil "" (now)))

(defn all
  []
  (map map->Experiment (db/query "SELECT * FROM experiment ORDER BY id ASC")))

(defn insert!
  ; (name: String, administrator_id: Int, html: String)
  [row]
  (->> row (db/insert! "experiment") map->Experiment))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM experiment WHERE id = ?" (as-long id)])
          first
          map->Experiment))

(defn find-or-create-accesstoken!
  [id & {:keys [length expires] :or {length 12}}]
  (AccessToken/find-or-create! "experiments" (as-long id) length expires))

(defn update!
  ; (id: Int, name: String, administrator_id: Int, html: String)
  [id set-map]
  (db/update! "experiment" set-map ["id = ?" (as-long id)]))

(defn delete!
  [id]
  (db/delete! "experiment" ["id = ?" (as-long id)]))
