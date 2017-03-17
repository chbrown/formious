(ns formious.db.experiment
  (:require [formious.db :as db]
            [formious.db.access-token :as AccessToken])
  (:import [java.time ZonedDateTime]))

; Int String Int String ZonedDateTime
(defrecord Experiment [id name administrator_id html created])

(defn blank
  []
  (Experiment. 0 "" nil "" (ZonedDateTime/now)))

(defn all
  []
  (map map->Experiment (db/query "SELECT * FROM experiment ORDER BY id ASC")))

(defn insert!
  ; (name: String, administrator_id: Int, html: String)
  [row]
  (->> row (db/insert! "experiment") map->Experiment))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM experiment WHERE id = ?", id])
          first
          map->Experiment))

(defn find-or-create-access-token
  [id & {:keys [length expires] :or {length 12}}]
  (AccessToken/find-or-create "experiments" id length expires))

(defn update!
  ; (id: Int, name: String, administrator_id: Int, html: String)
  [id set-map]
  (db/update! "experiment" set-map ["id = ?" id]))

(defn delete!
  [id]
  (db/delete! "experiment" ["id = ?", id]))
