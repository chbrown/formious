(ns formious.db.awsaccount
  (:require [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn all
  []
  (db/query "SELECT * FROM awsaccount ORDER BY id DESC"))

(defn insert!
  [row]
  (db/insert! "awsaccount" row))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM awsaccount WHERE id = ?" (as-long id)])))

(defn update!
  [id set-map]
  (db/update! "awsaccount" set-map ["id = ?" (as-long id)]))

(defn all-by-administrator
  [administrator_id]
  (db/query ["SELECT * FROM awsaccount
                JOIN awsaccount_administrator ON awsaccount_administrator.awsaccount_id = awsaccount.id
              WHERE awsaccount_administrator.administrator_id = ?
              ORDER BY awsaccount_administrator.priority DESC" administrator_id]))
