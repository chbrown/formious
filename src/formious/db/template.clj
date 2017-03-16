(ns formious.db.template
  (:require [formious.db :as db])
  (:import [java.time ZonedDateTime]))

(defrecord Template [^Integer id ^String name ^String html ^ZonedDateTime created])

(defn blank
  []
  {:name "", :html ""})

(defn all
  []
  (->> (db/query "SELECT * FROM template ORDER BY id ASC") (map map->Template)))

(defn find-by-id
  [id]
  (->> (db/query ["SELECT * FROM template WHERE id = ?" id]) first map->Template))

(defn insert!
  [row]
  (->> row (db/insert! "template") first map->Template))

(defn update!
  [^Integer id set-map]
  (db/update! "template" set-map ["id = ?" id]))

(defn delete!
  [^Integer id]
  (db/delete! "template" ["id = ?" id]))
