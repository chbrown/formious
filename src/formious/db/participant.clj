(ns formious.db.participant
  (:require [formious.common :refer [->long]]
            [formious.db.common :as db]))

; Int Option[String] Option[String] math.BigDecimal math.BigDecimal Option[String] Option[String] ZonedDateTime
(defrecord Participant [id name aws_worker_id aws_bonus_owed aws_bonus_paid ip_address user_agent created])
(def writable-columns ["name" "aws_worker_id" "aws_bonus_owed" "aws_bonus_paid" "ip_address" "user_agent"])

(defn all
  []
  (map map->Participant (db/query "SELECT * FROM participant ORDER BY id ASC")))

(defn insert!
  ; (aws_worker_id: String, ip_address: Option[String], user_agent: Option[String])
  [row]
  (->> row (db/insert! "participant") map->Participant))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM participant WHERE id = ?" (->long id)])
          first
          map->Participant))

(defn update!
  [id set-map]
  (db/update! "participant" set-map ["id = ?" (->long id)]))

(defn find-or-create-by-worker-id!
  [aws_worker_id & {:keys [ip_address user_agent]}]
  (if-let [participants (db/query ["SELECT * FROM participant WHERE aws_worker_id = ?" aws_worker_id])]
    (-> participants first map->Participant)
    (insert! {:aws_worker_id aws_worker_id :ip_address ip_address :user_agent user_agent})))

(defn find-or-create!
  ; TODO: refactor this
  [id aws_worker_id]
  (if id
    (find-by-id id)
    (when aws_worker_id
      (find-or-create-by-worker-id! aws_worker_id nil nil))))
