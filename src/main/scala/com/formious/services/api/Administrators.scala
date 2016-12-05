package com.formious.services.api

import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import com.formious.models.{Administrator, AWSAccount, AWSAccountAdministrator}
import com.formious.common.Encoders._
import com.formious.common.Decoders._

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object Administrators {
  case class AdministratorData(email: String,
                               password: String)

  object PriorityParamMatcher extends OptionalQueryParamDecoderMatcher[String]("priority")

  val service = HttpService {
    case GET -> Root =>
      Ok(Administrator.all.asJson)
    case GET -> Root / "new" =>
      Ok(AdministratorData("", "").asJson)
    case request @ POST -> Root =>
      request.as(jsonOf[AdministratorData]).flatMap { bodyAdministrator =>
        val AdministratorData(email, password) = bodyAdministrator
        val administrator = Administrator.create(email, password)
        Created(administrator.asJson)
      }
    case GET -> Root / IntVar(id) =>
      val administrator = Administrator.find(id)
      // serialize without hashed password
      val administratorCursor = administrator.asJson.hcursor.downField("password").delete
      // after the delete, the cursor is already back up at the top
      Ok(administratorCursor.focus.get)
    case request @ POST -> Root / IntVar(id) =>
      request.as(jsonOf[Administrator]).flatMap { bodyAdministrator =>
        val Administrator(_, email, password, _) = bodyAdministrator
        // TODO: make the password optional and hash it if it is not empty
        Administrator.updateCredentials(id, email, Option(password).filter(!_.isEmpty))
        NoContent()
      }
    case DELETE -> Root / IntVar(id) =>
      Administrator.delete(id)
      NoContent()

    // Administrator <-> AWS Account many2many relationship

    case GET -> Root / IntVar(administrator_id) / "aws_accounts" =>
      // GET /api/administrators/:administrator_id/aws_accounts
      // List administrator-AWS accounts linked to this administrator
      Ok(AWSAccount.allByAdministrator(administrator_id).asJson)
    case POST -> Root / IntVar(administrator_id) / "aws_accounts" / IntVar(aws_account_id) :? PriorityParamMatcher(priority) =>
      // POST /api//:administrator_id/aws_accounts/:aws_account_id
      // Create administrator-AWS account link
      val awsAccountAdministrator = AWSAccountAdministrator.create(administrator_id, aws_account_id, priority.map(_.toInt))
      Created(awsAccountAdministrator.asJson)
    case POST -> Root / IntVar(administrator_id) / "aws_accounts" / IntVar(aws_account_id) =>
      // DELETE /api/administrators/:administrator_id/aws_accounts/:aws_account_id
      // Delete administrator-AWS account link
      AWSAccountAdministrator.delete(administrator_id, aws_account_id)
      NoContent()
  }
}
