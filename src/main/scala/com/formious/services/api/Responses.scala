package com.formious.services.api

import scalikejdbc._
import io.finch._
import io.finch.circe._
import com.formious.models.{Participant, Response}

object Responses {
  /** GET /api/responses */
  val listResponses: Endpoint[List[Response]] = get(paramOption("limit").as[Int] :: paramOption("experiment_id").as[Int] :: paramOption("template_id").as[Int] :: paramOption("aws_worker_id")) { (limit: Option[Int], experiment_id: Option[Int], template_id: Option[Int], aws_worker_id: Option[String]) =>
    val maxLimit = math.min(limit.getOrElse(250), 1000)
    val responses = Response.allWhere(maxLimit, experiment_id, template_id, aws_worker_id)
    Ok(responses)
  }

  /** POST /api/responses */
  val createResponse: Endpoint[Response] = post(paramOption("participant_id").as[Int] :: paramOption("aws_worker_id") :: param("block_id").as[Int] :: param("data") :: paramOption("assignment_id")) { (participantIdOption: Option[Int], workerIdOption: Option[String], block_id: Int, data: String, assignment_id: Option[String]) =>
    DB.localTx { implicit session =>
      val participantOption = (participantIdOption, workerIdOption) match {
        case (Some(participantId), _) => Some(Participant.find(participantId))
        case (_, Some(workerId)) => Some(Participant.findOrCreateByWorkerId(workerId, None, None))
        case _ => None
      }
      // TODO: why can't I chain this match right after the first one?
      participantOption match {
        case Some(participant) => Some(Response.insert(participant.id, block_id, data, assignment_id))
        case None => None
      }
    } match {
      case Some(response) =>
        Ok(response)
      case None =>
        NotFound(new Exception("No matching participant found"))
    }
  }

  /** GET /api/responses/:id */
  val showResponse: Endpoint[Response] = get(int) { (id: Int) =>
    Ok(Response.find(id))
  }

  val endpoint = "responses" ::
    (listResponses :+: createResponse :+: showResponse)
}
