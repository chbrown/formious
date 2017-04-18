(ns formious.db.aws-account-administrator
  (:require [formious.common :refer [now ->long]]
            [formious.db.common :as db]))

; Int Int Int Int ZonedDateTime
(defrecord AWSAccountAdministrator [id aws_account_id administrator_id priority created])
(def writable-columns ["aws_account_id" "administrator_id" "priority"])

(defn blank
  []
  (AWSAccountAdministrator. 0 "" "" 0 (now)))

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
  (db/delete! "aws_account_administrator" ["aws_account_id = ? AND administrator_id = ?"
                                           (->long aws_account_id) (->long administrator_id)]))
