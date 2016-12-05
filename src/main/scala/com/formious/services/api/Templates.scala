package com.formious.services.api

import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import com.formious.models.Template
import com.formious.common.Encoders._
import com.formious.common.Decoders._

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object Templates {
  case class TemplateData(name: String,
                          html: String)

  val service = HttpService {
    case GET -> Root =>
      // List all templates
      Ok(Template.all.asJson)
    case GET -> Root / "new" =>
      // Generate blank template
      Ok(TemplateData("", "").asJson)
    case request @ POST -> Root =>
      // Create new template
      request.as(jsonOf[TemplateData]).flatMap { bodyTemplate =>
        val TemplateData(name, html) = bodyTemplate
        val template = Template.create(name, html)
        // if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
        //   // 303 is a "See other" and SHOULD include a Location header
        //   return res.status(303).die('Template already exists')
        // }
        Created(template.asJson)
      }
    case GET -> Root / IntVar(id) =>
      // Show existing template
      val template = Template.find(id)
      Ok(template.asJson).putHeaders(Header("Cache-Control", "max-age=5"))
    case request @ POST -> Root / IntVar(id) =>
      // Update existing template
      request.as(jsonOf[Template]).flatMap { bodyTemplate =>
        val Template(_, name, html, _) = bodyTemplate
        Template.update(id, name, html)
        NoContent()
      }
    case DELETE -> Root / IntVar(id) =>
      // Delete existing template
      Template.delete(id)
      NoContent()
  }
}
