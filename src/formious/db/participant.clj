(ns formious.db.participant
  (:require [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn all
  []
  (db/query "SELECT * FROM participant ORDER BY id ASC"))

(defn insert!
  [row]
  (db/insert! "participant" row))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM participant WHERE id = ?" (as-long id)])))

(defn update!
  [id set-map]
  (db/update! "participant" set-map ["id = ?" (as-long id)]))

(defn find-or-create-by-worker-id!
  "participant-skeleton should look like:
  {:ip_address \"1.2.3.4\" :user_agent \"...\"}"
  [aws_worker_id participant-skeleton]
  (if-let [participants (db/query ["SELECT * FROM participant
                                    WHERE aws_worker_id = ?" aws_worker_id])]
    (first participants)
    (insert! (assoc participant-skeleton :aws_worker_id aws_worker_id))))

(defn find-or-create!
  ; TODO: refactor this
  [id aws_worker_id]
  (if id
    (find-by-id id)
    (when aws_worker_id
      (find-or-create-by-worker-id! aws_worker_id {}))))
