package com.formious.services

import scalikejdbc._
import io.finch._
import io.finch.circe._
import cats.data.Xor._
import io.circe._
import io.circe.parser._
import io.circe.generic.auto._
import io.circe.syntax.EncoderOps
import com.formious.models.{AccessToken, Response}
import com.formious.common.JsonUtil.mergeJsonObjects
import com.formious.common.Encoders._

object responses {
  case class ResponseMetadata(context: String,
                              experiment_id: Int,
                              name: Option[String],
                              aws_worker_id: Option[String])

  object ResponseMetadata {
    def apply(rs: WrappedResultSet) = new ResponseMetadata(
      rs.get("context"),
      rs.get("experiment_id"),
      rs.get("name"),
      rs.get("aws_worker_id"))
  }

  /** GET /experiments/:experiment_id/responses?token=ABCDEF12345
    * Requires authorization, but only by access token.
    * Show only the responses that reference this Experiment. */
  val getResponses: Endpoint[List[JsonObject]] = get("responses" :: param("experiment_id").as[Int] :: param("token") :: paramOption("accept") :: headerOption("accept")) { (experiment_id: Int, token: String, paramAcceptOption: Option[String], headerAcceptOption: Option[String]) =>
    //val accept = paramAcceptOption.orElse(headerAcceptOption).getOrElse("application/json boundary=LF")
    DB.readOnly { implicit session =>
      AccessToken.check(token, "experiments", experiment_id).map { accessToken =>
        // yay, authorization granted
        val responses = sql"""
          SELECT responses.*, blocks.context, blocks.experiment_id, participants.name, participants.aws_worker_id
          FROM responses, participants, blocks
          WHERE participants.id = responses.participant_id
            AND blocks.id = responses.block_id
            AND experiment_id = $experiment_id
          ORDER BY responses.id DESC
        """.map(rs => (Response(rs), ResponseMetadata(rs))).list.apply()
        //val writer = adapt.createTransform(accept)
        //val responseContentType = writer.content_type
        responses.map { case (response, responseMetadata) =>
          val responseDataJson = parse(response.data).map(_.asObject) match {
            case Right(Some(o)) => o
            case _ => JsonObject.empty
          }
          val contextJson = parse(responseMetadata.context).map(_.asObject) match {
            case Right(Some(o)) => o
            case _ => JsonObject.empty
          }

          val responseJson = response.asJsonObject
          //val responseMetadataJson = responseMetadata.asJson

          //"participant_name" -> responseMetadata.name.orElse(responseMetadata.aws_worker_id),
          // merge those static values with the dynamic context and value objects,
          // using _.defaults so that further-left arguments have priority
          // if value is null, that will stall the writer, which we don't want
          mergeJsonObjects(mergeJsonObjects(responseDataJson, responseJson), contextJson)
        }
      }
    } match {
      case Some(extendedResponses) =>
        Ok(extendedResponses) //.withHeader("Content-Type", responseContentType)
      case None =>
        Unauthorized(new Exception("Invalid access token"))
    }
  }

  val service = getResponses.toServiceAs[Application.Json]
}
