(ns formious.db.awsaccount-administrator
  (:require [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn all
  []
  (db/query "SELECT * FROM awsaccount_administrator"))

(defn insert!
  [row]
  (db/insert! "awsaccount_administrator" row))

(defn delete!
  [awsaccount_id administrator_id]
  (db/delete! "awsaccount_administrator" ["awsaccount_id = ? AND administrator_id = ?"
                                          (as-long awsaccount_id) (as-long administrator_id)]))
