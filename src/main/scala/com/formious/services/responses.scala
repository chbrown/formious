package com.formious.services

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

import io.circe.syntax.EncoderOps

import com.formious.models.{AccessToken, Response}

object responses {
  object Token extends QueryParamDecoderMatcher[String]("token")
  object ExperimentId extends QueryParamDecoderMatcher[Int]("experiment_id")
  //paramOption("accept") :: headerOption("accept")

  val service = HttpService {
    case GET -> Root :? ExperimentId(experiment_id) +& Token(token) =>
      // GET /experiments/:experiment_id/responses?token=ABCDEF12345
      // Requires authorization, but only by access token.
      // Show only the responses that reference this Experiment.
      //paramAcceptOption: Option[String], headerAcceptOption: Option[String]) =>
      //val accept = paramAcceptOption.orElse(headerAcceptOption).getOrElse("application/json boundary=LF")
      AccessToken.check(token, "experiments", experiment_id) match {
        case Some(accessToken) =>
          // yay, authorization granted
          val responses = Response.extendedResponses(experiment_id)
          Ok(responses.asJson) //.withHeader("Content-Type", responseContentType)
        case None =>
          Unauthorized(Challenge("Basic", "Admin Realm")) // "Invalid access token"
      }
  }
}
