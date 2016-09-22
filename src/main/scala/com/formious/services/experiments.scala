package com.formious.services

import java.nio.charset.Charset

import com.twitter.io.Buf
import com.twitter.finagle.http.Status
import io.finch._
import io.finch.internal.BufText
import io.circe._
import io.circe.parser._
import scalikejdbc._
import com.gilt.handlebars.scala.binding.dynamic._
import com.gilt.handlebars.scala.Handlebars
import com.formious.models.{Block, Experiment, Participant, Response, Template}

object experiments {
  /** GET /experiments/:experiment_id
    * Redirect to first block of experiment */
  val startExperiment: Endpoint[String] = get(int) { (experiment_id: Int) =>
    Block.next(experiment_id) match {
      case Some(block) =>
        // val urlObj = url.parse(req.url, true)
        // val block_url = url.format(urlObj)
        Output.empty[String](Status.SeeOther).withHeader("Location" -> s"/experiments/$experiment_id/blocks/${block.id}")
      case None =>
        NotFound(new Exception("No available blocks"))
    }
  }

  case class LayoutContext(context: String, header: String, html: String)

  /** GET /experiments/:experiment_id/blocks/:block_id
    * Render block as html
    *
    * the querystring will usually have the fields: assignmentId, hitId, turkSubmitTo, workerId
    *
    * the Amazon Mechanical Turk frame will give us the following variables:
    *
    * https://tictactoe.amazon.com/gamesurvey.cgi?gameid=01523
    * &assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE
    * &hitId=123RVWYBAZW00EXAMPLE
    * &turkSubmitTo=https://www.mturk.com
    * &workerId=AZ3456EXAMPLE
    */
  val renderBlock: Endpoint[String] = get(int :: "blocks" :: int) { (experiment_id: Int, block_id: Int) =>
    val html = DB.readOnly { implicit session =>
      val experiment = Experiment.find(experiment_id)
      val block = Block.find(experiment_id, block_id)
      val blockTemplateHtml = block.template_id.map(Template.find).map(_.html).getOrElse("")

      // context: the current state to render the template with
      //.as[Map[String, Json]]
      val blockContext: Json = parse(block.context).getOrElse(Json.Null)
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
      layoutFn(layoutContext)
    }
    Ok(html)
  }

  /** POST /experiments/:experiment_id/blocks/:block_id
    * Save response */
  val saveResponse: Endpoint[String] = post(int :: "blocks" :: int :: body :: paramOption("workerId") :: paramOption("assignmentId") :: headerOption("x-real-ip") :: headerOption("user-agent") :: headerOption("x-requested-with")) { (experiment_id: Int, block_id: Int, body: String, workerIdOption: Option[String], assignmentId: Option[String], ipAddress: Option[String], userAgent: Option[String], requestedWith: Option[String]) =>
    val workerId = workerIdOption.getOrElse("WORKER_ID_NOT_AVAILABLE")
    //val ipAddress = ipAddressHeader // OrElse(request.remoteAddress.toString)
    val postData = parse(body).getOrElse(Json.Null)

    DB.localTx { implicit session =>
      val participant = Participant.findOrCreateByWorkerId(workerId, ipAddress, userAgent)
      Response.insert(participant.id, block_id, postData.toString, assignmentId)

      // http://docs.aws.amazon.com/AWSMechTurk/latest/AWSMturkAPI/ApiReference_ExternalQuestionArticle.html
      // sadly, this redirect_to doesn't work. Hopefully the user will have a proper
      // POST-to-MT form in their last block
      // val redirect_to = urlObj.query.turkSubmitTo + "/mturk/externalSubmit?assignmentId=" + urlObj.query.assignmentId
      Block.nextBlock(experiment_id, block_id, participant.id) match {
        case Some(block) =>
          //println(s"models.Block.nextBlockId: ${block.id}")

          // only change the path part of the url
          val newPathname = s"/experiments/$experiment_id/blocks/${block.id}"
          val redirect_to = newPathname // url.format(urlObj)

          if (requestedWith.contains("XMLHttpRequest")) {
            NoContent[String].withHeader("Location" -> redirect_to)
          }
          else {
            Output.empty[String](Status.Found).withHeader("Location" -> redirect_to)
          }
        case None =>
          // meaning, there are no more blocks to complete
          Ok("You have already completed all available blocks in this experiment.")
      }
    }
  }

  type Html[A] = Encode.Aux[A, Text.Html]

  def html[A](fn: (A, Charset) => Buf): Html[A] =
    Encode.instance[A, Text.Html](fn)

  implicit val encodeHtml: Html[String] =
    html((s, charset) => BufText(s, charset))

  implicit val encodeExceptionAsHtml: Html[Exception] = html(
    (e, charset) => BufText(Option(e.getMessage).getOrElse(""), charset)
  )

  val service = ("experiments" ::
    (startExperiment :+: renderBlock :+: saveResponse)).toServiceAs[Text.Html]
}
