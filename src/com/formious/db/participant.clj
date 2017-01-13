(ns com.formious.db.participant
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

; Int Option[String] Option[String] math.BigDecimal math.BigDecimal Option[String] Option[String] ZonedDateTime
(defrecord Participant [id name aws_worker_id aws_bonus_owed aws_bonus_paid ip_address user_agent created])

(defn row->Participant
  [row]
  (map->Participant (update row :created .toZonedDateTime)))

(defn all
  []
  (map row->AWSAccount (db/query "SELECT * FROM participant ORDER BY id ASC")))

(defn insert!
  ; (aws_worker_id: String, ip_address: Option[String], user_agent: Option[String])
  [row]
  (->> row (db/insert! "participant") row->AWSAccountAdministrator))

(defn find-by-id
  [id]
  (-> (db/query ["SELECT * FROM participant WHERE id = ?", id])
      first
      row->Participant))

(defn update!
  [id set-map]
  (db/update! "participant" set-map ["id = ?" id]))

(defn find-or-create-by-worker-id
  [aws_worker_id & {:keys [ip_address user_agent]}]
  (if-let [participants (db/query ["SELECT * FROM participant WHERE aws_worker_id = ?" aws_worker_id])]
    (-> participants first row->AWSAccount)
    (insert! {:aws_worker_id aws_worker_id :ip_address ip_address :user_agent user_agent})))

(defn find-or-create
  ; TODO: refactor this
  [id aws_worker_id]
  (if id
    (find-by-id id)
    (when aws_worker_id
      (find-or-create-by-worker-id aws_worker_id nil nil))))
