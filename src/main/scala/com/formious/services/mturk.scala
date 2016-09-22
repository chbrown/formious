package com.formious.services

import com.formious.models.{Participant, Response}
import io.circe.Json
import io.circe.parser._
import io.finch.{Endpoint, Text, _}
import scalikejdbc.DB

object mturk {
  /** POST /mturk/externalSubmit
    *
    * This is a testing filler for the MTurk production / sandbox final POST, which
    * will point to https://www.mturk.com/mturk/externalSubmit for production HITs,
    * or https://workersandbox.mturk.com/mturk/externalSubmit for sandbox HITs. The
    * MTurk ExternalQuestion format automatically adds a `?turkSubmitTo` querystring
    * parameter to the given URL, but if that's missing, it'll be evaluated as the
    * empty string, and so missing final post backs will hit this endpoint.
    */
  val externalSubmit: Endpoint[String] = post("mturk" :: "externalSubmit" :: body :: paramOption("workerId") :: paramOption("assignmentId") :: paramOption("block_id").as[Int]) { (body: String, workerIdOption: Option[String], assignmentId: Option[String], blockIdOption: Option[Int]) =>
    val workerId = workerIdOption.getOrElse("WORKER_ID_NOT_AVAILABLE")
    // maybe fail on null block_id?
    val blockId = blockIdOption.getOrElse(0)
    DB.localTx { implicit session =>
      val participant = Participant.findOrCreateByWorkerId(workerId, None, None)
      val postData = parse(body).getOrElse(Json.Null)
      Response.insert(participant.id, blockId, postData.toString, assignmentId)
    }
    Ok("Your responses have been submitted and saved.")
  }

  val service = externalSubmit.toServiceAs[Text.Plain]
}
