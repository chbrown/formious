(ns com.formious.db.response
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

; Int Int Int JsonObject Option[String] ZonedDateTime
(defrecord Response [id participant_id block_id data assignment_id created])

(defn row->Response
  [row]
  (-> row
      (update :data json/read-str)
      (update :created .toZonedDateTime)
      (map->Response)))

(defn find-by-id
  [id]
  (-> (db/query ["SELECT * FROM response WHERE id = ?", id])
      first
      row->Response))

(defn insert!
  ; (participant_id: Int, block_id: Int, data: String = "{}", assignment_id: Option[String] = None)
  [row]
  (->> row (db/insert! "response") row->AWSAccountAdministrator))

(defn whereParticipant
  [participant_id]
  (map row->AWSAccount (db/query ["SELECT * FROM response WHERE participant_id = ?" participant_id])))

; (defn allWhere(limit: Int,
;                experiment_id: Option[Int],
;                template_id: Option[Int],
;                aws_worker_id: Option[String]) = {
;     ; 'id' and 'created' from the other tables conflict with responses
;     query("
;       SELECT *, response.id AS id, response.created AS created, COUNT(response.id) OVER() AS count
;         FROM response
;           INNER JOIN participant ON participant.id = response.participant_id
;           INNER JOIN block ON block.id = response.block_id
;         WHERE (block.experiment_id = ? OR ?::int IS NULL)
;           AND (block.template_id = ? OR ?::int IS NULL)
;           AND (participant.aws_worker_id = ? OR ?::int IS NULL)
;         ORDER BY response.created DESC
;         LIMIT ?
;     ", List(experiment_id, experiment_id, template_id, template_id, aws_worker_id, aws_worker_id, limit)) { resultSet =>
;       JsonUtil.resultSetToJson(resultSet)
;     }
;   }

;   case class ResponseMetadata(context: String,
;                               experiment_id: Int,
;                               name: Option[String],
;                               aws_worker_id: Option[String])

;   object ResponseMetadata {
;     def apply(row: ResultSet) = new ResponseMetadata(
;       row.getString("context"),
;       row.getInt("experiment_id"),
;       Option(row.getString("name")),
;       Option(row.getString("aws_worker_id")))
;   }

;   def extendedResponses(experiment_id: Int): Seq[JsonObject] = {
;     val responses = query("
;       SELECT responses.*, blocks.context, blocks.experiment_id, participants.name, participants.aws_worker_id
;       FROM responses, participants, blocks
;       WHERE participants.id = responses.participant_id
;         AND blocks.id = responses.block_id
;         AND experiment_id = ?
;       ORDER BY responses.id DESC
;     ", List(experiment_id)) { row => (Response(row), ResponseMetadata(row)) }
;     ;val writer = adapt.createTransform(accept)
;     ;val responseContentType = writer.content_type
;     val extendedResponses = responses.map { case (response, responseMetadata) =>
;       val contextJson = parse(responseMetadata.context).toOption.flatMap(_.asObject).getOrElse(JsonObject.empty)

;       val responseJson = response.asJsonObject
;       ;val responseMetadataJson = responseMetadata.asJson

;       ;"participant_name" -> responseMetadata.name.orElse(responseMetadata.aws_worker_id),
;       ; merge those static values with the dynamic context and value objects,
;       ; using _.defaults so that further-left arguments have priority
;       ; if value is null, that will stall the writer, which we don't want
;       JsonUtil.mergeJsonObjects(Seq(response.data, responseJson, contextJson))
;     }
;     extendedResponses
;   }
; }
