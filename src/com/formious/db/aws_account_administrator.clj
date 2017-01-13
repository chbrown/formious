(ns com.formious.db.aws-account-administrator
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

; Int Int Int Int ZonedDateTime
(defrecord AWSAccountAdministrator [id aws_account_id administrator_id priority created])

(defn row->AWSAccountAdministrator
  [row]
  (map->AWSAccountAdministrator (update row :created .toZonedDateTime)))

(defn all
  []
  (->> (db/query "SELECT * FROM aws_account_administrator")
       (map row->AWSAccountAdministrator)))

(defn insert!
  ; (aws_account_id: Int, administrator_id: Int, priority: Option[Int])
  [row]
  (->> row (db/insert! "aws_account_administrator") row->AWSAccountAdministrator))

(defn delete!
  [aws_account_id administrator_id]
  (db/delete! "aws_account_administrator" ["aws_account_id = ? AND administrator_id = ?" aws_account_id, administrator_id]))
