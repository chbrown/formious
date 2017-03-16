(ns formious.db.aws-account-administrator
  (:require [formious.db :as db])
  (:import [java.time ZonedDateTime]))

; Int Int Int Int ZonedDateTime
(defrecord AWSAccountAdministrator [id aws_account_id administrator_id priority created])

(defn all
  []
  (->> (db/query "SELECT * FROM aws_account_administrator")
       (map map->AWSAccountAdministrator)))

(defn insert!
  ; (aws_account_id: Int, administrator_id: Int, priority: Option[Int])
  [row]
  (->> row (db/insert! "aws_account_administrator") map->AWSAccountAdministrator))

(defn delete!
  [aws_account_id administrator_id]
  (db/delete! "aws_account_administrator" ["aws_account_id = ? AND administrator_id = ?" aws_account_id, administrator_id]))
