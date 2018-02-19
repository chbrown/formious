(ns formious.db.response
  (:require [clojure.data.json :as json]
            [formious.util :refer [as-long]]
            [formious.db :as db]))

; Int Int Int JsonObject Option[String] ZonedDateTime
(defrecord Response [id participant_id block_id data assignment_id created])
(def writable-columns
  ["participant_id"
   "block_id"
   "data"
   "assignment_id"])

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM response WHERE id = ?" (as-long id)])
          first
          map->Response))

(defn insert!
  ; (participant_id: Int, block_id: Int, data: String = "{}", assignment_id: Option[String] = None)
  [row]
  (->> row (db/insert! "response") map->Response))

(defn whereParticipant
  [participant_id]
  (map map->Response (db/query ["SELECT * FROM response WHERE participant_id = ?" participant_id])))

(defn all-where
  ; (limit: Int, experiment_id: Option[Int], template_id: Option[Int], aws_worker_id: Option[String])
  [limit experiment_id template_id aws_worker_id]
  ; 'id' and 'created' from the other tables conflict with responses
  (->> (db/query ["SELECT *, response.id AS id, response.created AS created, COUNT(response.id) OVER() AS count
        FROM response
          INNER JOIN participant ON participant.id = response.participant_id
          INNER JOIN block ON block.id = response.block_id
        WHERE (block.experiment_id = ? OR ?::int IS NULL)
          AND (block.template_id = ? OR ?::int IS NULL)
          AND (participant.aws_worker_id = ? OR ?::text IS NULL)
        ORDER BY response.created DESC
        LIMIT ?" experiment_id experiment_id template_id template_id aws_worker_id aws_worker_id limit])
       (map map->Response)))

(defrecord ResponseMetadata [context experiment_id name aws_worker_id])

(defn extended-responses
  [experiment_id]
  (let [rows (db/query ["SELECT responses.*, blocks.context, blocks.experiment_id, participants.name, participants.aws_worker_id
      FROM responses, participants, blocks
      WHERE participants.id = responses.participant_id
        AND blocks.id = responses.block_id
        AND experiment_id = ?
      ORDER BY responses.id DESC" experiment_id])]
    (for [row rows]
      (let [response (map->Response row)
            responseMetadata (map->ResponseMetadata row)
            contextJson (json/read-str (:context responseMetadata))]
        ; merge those static values with the dynamic context and value objects,
        ; so that further-left arguments have priority
        (merge (:data response) response contextJson)))))
