(ns com.formious.db.experiment
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

(defrecord Experiment
  ; Int String Int String ZonedDateTime
  [id name administrator_id html created])

(defn row->Experiment
  [row]
  (map->Experiment (update row :created .toZonedDateTime)))

(defn all
  []
  (map row->AWSAccount (db/query "SELECT * FROM experiment ORDER BY id ASC")))

(defn insert!
  ; (name: String, administrator_id: Int, html: String)
  [row]
  (->> row (db/insert! "experiment") row->AWSAccountAdministrator))

(defn find-by-id
  [id]
  (-> (db/query ["SELECT * FROM experiment WHERE id = ?", id])
      first
      row->Experiment))

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
