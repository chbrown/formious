package com.formious.services

import io.circe._
import io.circe.parser._

import com.gilt.handlebars.scala.binding.dynamic._
import com.gilt.handlebars.scala.Handlebars

import com.formious.models.{Block, Experiment, Participant, Response, Template}

import org.http4s._
import org.http4s.dsl._

object experiments {
  //object AWSAccountId extends QueryParamDecoderMatcher[Int]("aws_account_id")
  object ExperimentId extends QueryParamDecoderMatcher[Int]("experiment_id")
  object AssignmentId extends OptionalQueryParamDecoderMatcher[String]("AssignmentId")
  object WorkerId extends OptionalQueryParamDecoderMatcher[String]("workerId")

  case class LayoutContext(context: String, header: String, html: String)

  val service = HttpService {
    case GET -> Root / IntVar(experiment_id) =>
      // Redirect to first block of experiment
      Block.next(experiment_id) match {
        case Some(block) =>
          // val urlObj = url.parse(req.url, true)
          // val block_url = url.format(urlObj)
          SeeOther(Uri(path=s"/experiments/$experiment_id/blocks/${block.id}")) // location=
        case None =>
          NotFound("No available blocks")
      }
    case GET -> Root / IntVar(experiment_id) / "blocks" / IntVar(block_id) =>
      // Render block as html
      // the querystring will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
      // the Amazon Mechanical Turk frame will give us the following variables:
      //
      // https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
      // &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
      // &hitId=123RVWYBAZW00EXAMPLE
      // &turkSubmitTo=https://www.mturk.com
      // &workerId=AZ3456EXAMPLE
      val experiment = Experiment.find(experiment_id)
      val block = Block.find(experiment_id, block_id)
      // why do I need these parens around the match?
      val blockTemplateHtml = block.template_id match {
        case Some(template_id) => Template.find(template_id).html
        case None => ""
      }
      // context: the current state to render the template with
      //.as[Map[String, Json]]
      val blockContext = parse(block.context).getOrElse(Json.Null)
      // Supply "experiment_id" and "block_id" in the blockContext
      val fullContext = blockContext.hcursor
        .downField("experiment_id").set(Json.fromInt(experiment_id))
        .field("block_id").set(Json.fromInt(block_id))
        .up.focus.get

      // TODO: handle errors (maybe add default for missing html, and use it for broken templates)
      val blockTemplateFn = Handlebars(blockTemplateHtml)
      val templateHtml = blockTemplateFn(fullContext)

      // TODO: memoize/cache the layout Handlebars template function
      val layoutStream = getClass.getResourceAsStream("/block.html")
      val layout = scala.io.Source.fromInputStream(layoutStream).mkString
      val layoutFn = Handlebars(layout)

      val contextJsonString = fullContext.noSpaces //.replaceAll("<\/".r, "<\\/")

      val layoutContext = LayoutContext(contextJsonString, experiment.html, templateHtml)
      val html = layoutFn(layoutContext)
      Ok(html)
    case request @ POST -> Root / IntVar(experiment_id) / "blocks" / IntVar(block_id) :? WorkerId(workerIdOption) +& AssignmentId(assignmentIdOption) =>
      // Save response
      val workerId = workerIdOption.getOrElse("WORKER_ID_NOT_AVAILABLE")
      //val assignmentId = assignmentIdOption.getOrElse("ASSIGNMENT_ID_NOT_AVAILABLE")
      val ipAddress: Option[String] = request.headers.get("x-real-ip".ci).map(_.value)
      //val ipAddress = ipAddressHeader // OrElse(request.remoteAddress.toString)
      val userAgent: Option[String] = request.headers.get("user-agent".ci).map(_.value)
      val requestedWith: Option[String] = request.headers.get("x-requested-with".ci).map(_.value)

      val participant = Participant.findOrCreateByWorkerId(workerId, ipAddress, userAgent)
      val blockOption = Block.nextBlock(experiment_id, block_id, participant.id)
      // http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
      // sadly, this redirect_to doesn't work. Hopefully the user will have a proper
      // POST-to-MT form in their last block
      // val redirect_to = urlObj.query.turkSubmitTo + "/mturk/externalSubmit?assignmentId=" + urlObj.query.assignmentId

      request.as[String].flatMap { postData =>
        //val postData = body parse().getOrElse(Json.Null)
        val response = Response.create(participant.id, block_id, postData, assignmentIdOption)
        blockOption match {
          case Some(block) =>
            // only change the path part of the url
            val newPathname = s"/experiments/$experiment_id/blocks/${block.id}"
            val redirect_to = newPathname // url.format(urlObj)

            if (requestedWith.contains("XMLHttpRequest")) {
              NoContent().putHeaders(Header("Location", redirect_to))
            }
            else {
              Found(Uri(path = redirect_to))
            }
          case None =>
            // meaning, there are no more blocks to complete
            Ok("You have already completed all available blocks in this experiment.")
        }
      }
  }
}
