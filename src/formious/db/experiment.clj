(ns formious.db.experiment
  (:require [formious.db.access-token :as AccessToken]
            [formious.db.common :as db :refer [now ->long]]))

; Int String Int String ZonedDateTime
(defrecord Experiment [id name administrator_id html created])
(def writable-columns ["name" "administrator_id" "html"])

(defn blank
  []
  (Experiment. 0 "" nil "" (now)))

(defn all
  []
  (map map->Experiment (db/query "SELECT * FROM experiment ORDER BY id ASC")))

(defn insert!
  ; (name: String, administrator_id: Int, html: String)
  [row]
  (->> row (db/insert! "experiment") map->Experiment))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM experiment WHERE id = ?" (->long id)])
          first
          map->Experiment))

(defn find-or-create-access-token!
  [id & {:keys [length expires] :or {length 12}}]
  (AccessToken/find-or-create! "experiments" (->long id) length expires))

(defn update!
  ; (id: Int, name: String, administrator_id: Int, html: String)
  [id set-map]
  (db/update! "experiment" set-map ["id = ?" (->long id)]))

(defn delete!
  [id]
  (db/delete! "experiment" ["id = ?" (->long id)]))
