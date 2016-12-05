package com.formious.services.api

import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import com.formious.models.AWSAccount
import com.formious.common.Encoders._
import com.formious.common.Decoders._

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object AWSAccounts {
  case class AWSAccountData(name: String,
                            access_key_id: String,
                            secret_access_key: String)

  val service = HttpService {
    case GET -> Root =>
      Ok(AWSAccount.all.asJson)
    case GET -> Root / "new" =>
      Ok(AWSAccountData("", "", "").asJson)
    case request @ POST -> Root =>
      request.as(jsonOf[AWSAccountData]).flatMap { bodyAWSAccount =>
        val AWSAccountData(name, access_key_id, secret_access_key) = bodyAWSAccount
        val awsAccount = AWSAccount.create(name, access_key_id, secret_access_key)
        Created(awsAccount.asJson)
      }
    case GET -> Root / IntVar(id) =>
      Ok(AWSAccount.find(id).asJson)
    case request @ POST -> Root / IntVar(id) =>
      request.as(jsonOf[AWSAccount]).flatMap { bodyAWSAccount =>
        val AWSAccount(_, name, access_key_id, secret_access_key, _) = bodyAWSAccount
        AWSAccount.update(id, name, access_key_id, secret_access_key)
        NoContent()
      }
    case DELETE -> Root / IntVar(id) =>
      AWSAccount.delete(id)
      NoContent()
  }
}
