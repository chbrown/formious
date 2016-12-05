package com.formious.services.api

import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import com.formious.models.{Participant, Response}
import com.formious.common.Encoders._

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object Responses {
  case class ResponseData(block_id: Int,
                          data: String,
                          assignment_id: Option[String])

  object Limit extends OptionalQueryParamDecoderMatcher[Int]("limit")
  object ParticipantId extends OptionalQueryParamDecoderMatcher[Int]("participant_id")
  object ExperimentId extends OptionalQueryParamDecoderMatcher[Int]("experiment_id")
  object TemplateId extends OptionalQueryParamDecoderMatcher[Int]("template_id")
  object AWSWorkerId extends OptionalQueryParamDecoderMatcher[String]("aws_worker_id")

  val service = HttpService {
    case GET -> Root :? Limit(limit) +& ExperimentId(experiment_id) +& TemplateId(template_id) +& AWSWorkerId(aws_worker_id) =>
      val maxLimit = math.min(limit.getOrElse(250), 1000)
      val responses = Response.allWhere(maxLimit, experiment_id, template_id, aws_worker_id)
      Ok(responses.asJson)

    case request @ POST -> Root :? ParticipantId(participantIdOption) +& AWSWorkerId(workerIdOption) =>
      Participant.findOrCreate(participantIdOption, workerIdOption) match {
        case Some(participant) =>
          request.as(jsonOf[ResponseData]).flatMap { bodyResponse =>
            val ResponseData(block_id, data, assignment_id) = bodyResponse
            val response = Response.create(participant.id, block_id, data, assignment_id)
            Created(response.asJson)
          }
        case None =>
          NotFound("No matching participant found")
      }

    case GET -> Root / IntVar(id) =>
      Ok(Response.find(id).asJson)
  }
}
