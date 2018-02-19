(ns formious.db.awsaccount
  (:require [era.core :refer [now]]
            [formious.util :refer [as-long]]
            [formious.db :as db]))

; Int String String String ZonedDateTime
(defrecord AWSAccount [id name access_key_id secret_access_key created])
(def writable-columns
  ["name"
   "access_key_id"
   "secret_access_key"])

(defn blank
  []
  (AWSAccount. "new" "" "" "" (now)))

(defn all
  []
  (->> (db/query "SELECT * FROM awsaccount ORDER BY id DESC")
       (map map->AWSAccount)))

(defn insert!
  ; (name: String, access_key_id: String, secret_access_key: String)
  [row]
  (->> row (db/insert! "awsaccount") map->AWSAccount))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM awsaccount WHERE id = ?" (as-long id)])
          first
          map->AWSAccount))

(defn update!
  ; (id: Int, name: String, access_key_id: String, secret_access_key: String)
  [id set-map]
  (db/update! "awsaccount" set-map ["id = ?" (as-long id)]))

(defn delete!
  [id]
  (db/delete! "awsaccount" ["id = ?" (as-long id)]))

(defn all-by-administrator
  [administrator_id]
  (->> (db/query ["SELECT * FROM awsaccount
                     JOIN awsaccount_administrator ON awsaccount_administrator.awsaccount_id = awsaccount.id
                   WHERE awsaccount_administrator.administrator_id = ?
                   ORDER BY awsaccount_administrator.priority DESC" administrator_id])
       (map map->AWSAccount)))
