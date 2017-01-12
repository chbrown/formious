(ns com.formious.db.template
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

(defrecord Template [^Int id ^String name ^String html ^ZonedDateTime created])

(defn row->Template
  [{:keys [id name html created]}]
  (Template. id name html (.toZonedDateTime created)))

(defn blank
  []
  {:name "", :html ""})

(defn all
  []
  (->> (db/query "SELECT * FROM template ORDER BY id ASC") (map row->Template)))

(defn find-by-id
  [id]
  (->> (db/query ["SELECT * FROM template WHERE id = ?" id]) first row->Template))

(defn insert!
  [^String name ^String html]
  (->> (db/insert! "template" [(Template. name html)]) first row->Template))

(defn update!
  [^Int id ^String name ^String html]
  (db/update! "template" {:name name, :html html} ["id = ?" id]))

(defn delete!
  [^Int id]
  (db/delete! "template" ["id = ?" id]))
