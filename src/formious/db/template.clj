(ns formious.db.template
  (:require [formious.db.common :as db :refer [now ->long]]))

; ^Integer ^String ^String ^ZonedDateTime
(defrecord Template [id name html created])
(def writable-columns ["name" "html"])

(defn blank
  []
  (Template. 0 "" "" (now)))

(defn all
  []
  (->> (db/query "SELECT * FROM template ORDER BY id ASC") (map map->Template)))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM template WHERE id = ?" (->long id)]) first map->Template))

(defn insert!
  [row]
  (->> row (db/insert! "template") first map->Template))

(defn update!
  [id set-map]
  (db/update! "template" set-map ["id = ?" (->long id)]))

(defn delete!
  [id]
  (db/delete! "template" ["id = ?" (->long id)]))
