package com.formious.services

import io.circe.Json
import io.circe.parser._

import com.formious.models.{Participant, Response}

import org.http4s._
import org.http4s.dsl._

object mturk {
  object WorkerId extends OptionalQueryParamDecoderMatcher[String]("workerId")
  object AssignmentId extends OptionalQueryParamDecoderMatcher[String]("assignmentId")
  object BlockId extends OptionalQueryParamDecoderMatcher[Int]("block_id")

  val service = HttpService {
    case request @ POST -> Root / "mturk" / "externalSubmit" :? WorkerId(workerIdOption) +& AssignmentId(assignmentId) +& BlockId(blockIdOption) =>
      // POST /mturk/externalSubmit
      // This is a testing filler for the MTurk production / sandbox final POST, which
      // will point to https://www.mturk.com/mturk/externalSubmit for production HITs,
      // or https://workersandbox.mturk.com/mturk/externalSubmit for sandbox HITs. The
      // MTurk ExternalQuestion format automatically adds a `?turkSubmitTo` querystring
      // parameter to the given URL, but if that's missing, it'll be evaluated as the
      // empty string, and so missing final post backs will hit this endpoint.
      val workerId = workerIdOption.getOrElse("WORKER_ID_NOT_AVAILABLE")
      // maybe fail on null block_id?
      val blockId = blockIdOption.getOrElse(0)
      val participant = Participant.findOrCreateByWorkerId(workerId, None, None)
      request.as[String].flatMap { body =>
        val postData = parse(body).getOrElse(Json.Null)
        val response = Response.create(participant.id, blockId, postData.toString, assignmentId)
        Ok("Your responses have been submitted and saved.")
      }
  }
}
