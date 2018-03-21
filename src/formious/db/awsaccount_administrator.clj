(ns formious.db.awsaccount-administrator
  (:require [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn all
  []
  (db/query "SELECT * FROM awsaccount_administrator"))

(defn insert!
  [row]
  (db/insert! "awsaccount_administrator" row))
