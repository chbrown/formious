(ns formious.resources.sql
  (:refer-clojure :exclude [update])
  (:require [formious.resources :refer [metadata table]]
            ; https://github.com/jkk/honeysql/blob/master/src/honeysql/helpers.cljc
            [honeysql.helpers :as sql]))

(defn- where=
  [sql-map pred-map]
  (reduce sql/merge-where sql-map (for [[k v] pred-map] [:= k v])))

(defn select
  "Compose a SELECT query for the table identified by `resource` (a keyword),
  filtering on equality with `where-params` (a map).
  Returns a honeysql map."
  ([resource]
   (select resource nil))
  ([resource where-params]
   (-> (apply sql/select (get-in metadata [resource :readable-columns] [:*]))
       (sql/from (table resource)) ; the namespace isn't automatically knocked off :(
       (sql/order-by :id)
       (where= where-params))))

(defn insert
  "Compose an INSERT query for the table identified by `resource` (a keyword),
  inserting a row with columns as specified by the keys in `value-params` (a map).
  Returns a honeysql map."
  [resource value-params]
  (-> (sql/insert-into (table resource))
      (sql/values [value-params])))

(defn update
  "Compose an UPDATE query for the table identified by `resource` (a keyword).
  Returns a honeysql map."
  [resource set-params where-params]
  (-> (sql/update (table resource))
      (sql/sset set-params)
      (where= where-params)))

(defn delete
  "Compose a DELETE query for the table identified by `resource` (a keyword),
  where matching `where-params` (a map) via equality.
  Returns a honeysql map."
  [resource where-params]
  (-> (sql/delete-from (table resource))
      (where= where-params)))

(defn delete-by-pk
  "Same as delete, but checks that `where-params` contains all the resource's pk-columns"
  [resource where-params]
  {:pre [(every? where-params (get-in metadata [resource :pk-columns]))]}
  (delete resource where-params))
