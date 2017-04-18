(ns formious.db.aws-account
  (:require [formious.common :refer [now ->long]]
            [formious.db.common :as db]))

; Int String String String ZonedDateTime
(defrecord AWSAccount [id name access_key_id secret_access_key created])
(def writable-columns ["name" "access_key_id" "secret_access_key"])

(defn blank
  []
  (AWSAccount. 0 "" "" "" (now)))

(defn all
  []
  (->> (db/query "SELECT * FROM aws_account ORDER BY id DESC")
       (map map->AWSAccount)))

(defn insert!
  ; (name: String, access_key_id: String, secret_access_key: String)
  [row]
  (->> row (db/insert! "aws_account") map->AWSAccount))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM aws_account WHERE id = ?" (->long id)])
          first
          map->AWSAccount))

(defn update!
  ; (id: Int, name: String, access_key_id: String, secret_access_key: String)
  [id set-map]
  (db/update! "aws_account" set-map ["id = ?" (->long id)]))

(defn delete!
  [id]
  (db/delete! "aws_account" ["id = ?" (->long id)]))

(defn all-by-administrator
  [administrator_id]
  (->> (db/query ["SELECT * FROM aws_account
                     JOIN aws_account_administrator ON aws_account_administrator.aws_account_id = aws_account.id
                   WHERE aws_account_administrator.administrator_id = ?
                   ORDER BY aws_account_administrator.priority DESC" administrator_id])
       (map map->AWSAccount)))
