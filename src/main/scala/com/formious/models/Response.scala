package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.Database.query
import com.formious.common.Recoders._

import cats.data.Xor._
import io.circe._
import io.circe.parser._
import io.circe.generic.auto._
import io.circe.syntax.EncoderOps
import com.formious.common.Encoders._
import com.formious.common.JsonUtil.mergeJsonObjects

case class Response(id: Int,
                    participant_id: Int,
                    block_id: Int,
                    data: JsonObject,
                    assignment_id: Option[String],
                    created: ZonedDateTime)

object Response {

  def apply(row: ResultSet) = new Response(
    row.getInt("id"),
    row.getInt("participant_id"),
    row.getInt("block_id"),
    // why isn't the value of JsonObject.empty an instance of Json?
    parse(row.getString("data")).toOption.flatMap(_.asObject).getOrElse(JsonObject.empty),
    Option(row.getString("assignment_id")),
    row.getTimestamp("created").toZonedDateTime)

  def find(id: Int) = {
    query("SELECT * FROM response WHERE id = ?", List(id))(Response.apply).head
  }

  def create(participant_id: Int,
             block_id: Int,
             data: String = "{}",
             assignment_id: Option[String] = None) = {
    query("""
      INSERT INTO response (participant_id, block_id, data, assignment_id)
      VALUES (?, ?, ?, ?) RETURNING *
    """, List(participant_id, block_id, data, assignment_id))(Response.apply).head
  }

  def whereParticipant(participant_id: Int) = {
    query("SELECT * FROM response WHERE participant_id = ?", List(participant_id))(Response.apply)
  }

  def allWhere(limit: Int,
               experiment_id: Option[Int],
               template_id: Option[Int],
               aws_worker_id: Option[String]) = {
    query("""
      SELECT *
        FROM response
          INNER JOIN participant ON participant.id = response.participant_id
          INNER JOIN block ON block.id = response.block_id
        WHERE (block.experiment_id = ? OR ?::int IS NULL)
          AND (block.template_id = ? OR ?::int IS NULL)
          AND (participant.aws_worker_id = ? OR ?::int IS NULL)
        LIMIT ?
    """, List(experiment_id, experiment_id, template_id, template_id, aws_worker_id, aws_worker_id, limit))(Response.apply)
  }

  case class ResponseMetadata(context: String,
                              experiment_id: Int,
                              name: Option[String],
                              aws_worker_id: Option[String])

  object ResponseMetadata {
    def apply(row: ResultSet) = new ResponseMetadata(
      row.getString("context"),
      row.getInt("experiment_id"),
      Option(row.getString("name")),
      Option(row.getString("aws_worker_id")))
  }

  def extendedResponses(experiment_id: Int): Seq[JsonObject] = {
    val responses = query("""
      SELECT responses.*, blocks.context, blocks.experiment_id, participants.name, participants.aws_worker_id
      FROM responses, participants, blocks
      WHERE participants.id = responses.participant_id
        AND blocks.id = responses.block_id
        AND experiment_id = ?
      ORDER BY responses.id DESC
    """, List(experiment_id)) { row => (Response(row), ResponseMetadata(row)) }
    //val writer = adapt.createTransform(accept)
    //val responseContentType = writer.content_type
    val extendedResponses = responses.map { case (response, responseMetadata) =>
      val contextJson = parse(responseMetadata.context).toOption.flatMap(_.asObject).getOrElse(JsonObject.empty)

      val responseJson = response.asJsonObject
      //val responseMetadataJson = responseMetadata.asJson

      //"participant_name" -> responseMetadata.name.orElse(responseMetadata.aws_worker_id),
      // merge those static values with the dynamic context and value objects,
      // using _.defaults so that further-left arguments have priority
      // if value is null, that will stall the writer, which we don't want
      println("Merging objects")
      println(response.data, responseJson, contextJson)

      mergeJsonObjects(Seq(response.data, responseJson, contextJson))
    }
    extendedResponses
  }
}
