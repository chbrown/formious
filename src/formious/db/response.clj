(ns formious.db.response
  (:require [clojure.data.json :as json]
            [formious.util :refer [as-long]]
            [formious.db :as db]))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM response WHERE id = ?" (as-long id)])))

(defn insert!
  [row]
  (db/insert! "response" row))

(defn whereParticipant
  [participant-id]
  (db/query ["SELECT * FROM response WHERE participant_id = ?" (as-long participant-id)]))

(defn all-where
  [limit experiment_id template_id aws_worker_id]
  ; 'id' and 'created' from the other tables conflict with responses
  (db/query ["SELECT *, response.id AS id, response.created AS created, COUNT(response.id) OVER() AS count
              FROM response
                INNER JOIN participant ON participant.id = response.participant_id
                INNER JOIN block ON block.id = response.block_id
              WHERE (block.experiment_id = ? OR ?::int IS NULL)
                AND (block.template_id = ? OR ?::int IS NULL)
                AND (participant.aws_worker_id = ? OR ?::text IS NULL)
              ORDER BY response.created DESC
              LIMIT ?"
             experiment_id experiment_id
             template_id template_id
             aws_worker_id aws_worker_id
             limit]))

(defn- extended-response
  [row]
  ; TODO: refactor (not sure why I split up response-metadata that way)
  (let [response (select-keys row [:id :participant_id :block_id :data :assignment_id :created])
        response-metadata (select-keys row [:context :experiment_id :name :aws_worker_id])
        context (json/read-str (:context response-metadata))]
    ; merge those static values with the dynamic context and value objects,
    ; so that further-left arguments have priority
    (merge (:data response) response context)))

(defn extended-responses
  [experiment_id]
  (map extended-response
       (db/query ["SELECT responses.*, blocks.context, blocks.experiment_id, participants.name, participants.aws_worker_id
                   FROM responses, participants, blocks
                   WHERE participants.id = responses.participant_id
                     AND blocks.id = responses.block_id
                     AND experiment_id = ?
                   ORDER BY responses.id DESC" experiment_id])))
