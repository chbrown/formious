(ns formious.db.util
  (:require [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn find-or-create-participant-by-worker-id!
  "participant-skeleton should look like:
  {:ip_address \"1.2.3.4\" :user_agent \"...\"}"
  [aws_worker_id participant-skeleton]
  (if-let [participants (db/query ["SELECT * FROM participant
                                    WHERE aws_worker_id = ?" aws_worker_id])]
    (first participants)
    (db/insert! "participant" (assoc participant-skeleton :aws_worker_id aws_worker_id))))

(defn find-or-create-participant!
  ; TODO: refactor this
  [id aws_worker_id]
  (if id
    (first (db/query ["SELECT * FROM participant WHERE id = ?" (as-long id)]))
    (when aws_worker_id
      (find-or-create-participant-by-worker-id! aws_worker_id {}))))
