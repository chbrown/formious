(ns formious.db.awsaccount-administrator
  (:require [era.core :refer [now]]
            [formious.util :refer [as-long]]
            [formious.db :as db]))

; Int Int Int Int ZonedDateTime
(defrecord AWSAccountAdministrator [id awsaccount_id administrator_id priority created])
(def writable-columns
  ["awsaccount_id"
   "administrator_id"
   "priority"])

(defn blank
  []
  (AWSAccountAdministrator. "new" "" "" 0 (now)))

(defn all
  []
  (->> (db/query "SELECT * FROM awsaccount_administrator")
       (map map->AWSAccountAdministrator)))

(defn insert!
  ; (awsaccount_id: Int, administrator_id: Int, priority: Option[Int])
  [row]
  (->> row (db/insert! "awsaccount_administrator") map->AWSAccountAdministrator))

(defn delete!
  [awsaccount_id administrator_id]
  (db/delete! "awsaccount_administrator" ["awsaccount_id = ? AND administrator_id = ?"
                                          (as-long awsaccount_id) (as-long administrator_id)]))
