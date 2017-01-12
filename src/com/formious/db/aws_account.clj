(ns com.formious.db.aws-account
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

(defrecord AWSAccount
  ; Int String String String ZonedDateTime
  [id name access_key_id secret_access_key created])

(defn row->AWSAccount
  [row]
  (map->AWSAccount (update row :created .toZonedDateTime)))

(defn all
  []
  (->> (db/query "SELECT * FROM aws_account ORDER BY id DESC")
       (map row->AWSAccount)))

(defn insert!
  ; (name: String, access_key_id: String, secret_access_key: String)
  [row]
  (->> row (db/insert! "aws_account") row->AWSAccountAdministrator))

(defn find-by-id
  [id]
  (-> (db/query ["SELECT * FROM aws_account WHERE id = ?", id])
      first
      row->AWSAccount))

(defn update!
  ; (id: Int, name: String, access_key_id: String, secret_access_key: String)
  [id set-map]
  (db/update! "aws_account" set-map ["id = ?" id]))

(defn delete!
  [id]
  (db/delete! "aws_account" ["id = ?", id]))

(defn all-by-administrator
  [administrator_id]
  (->> (db/query ["SELECT * FROM aws_account
                     JOIN aws_account_administrator.aws_account_id = aws_account.id
                   WHERE aws_account_administrator.administrator_id = ?
                   ORDER BY aws_account_administrator.priority DESC", administrator_id])
       (map row->AWSAccount)))
