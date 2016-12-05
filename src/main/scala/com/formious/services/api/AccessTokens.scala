package com.formious.services.api

import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import com.formious.models.AccessToken
import com.formious.common.Encoders._
import com.formious.common.Decoders._

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object AccessTokens {
  val service = HttpService {
    case GET -> Root =>
      // List all access tokens
      Ok(AccessToken.all.asJson)
    case GET -> Root / "new" =>
      // Generate blank access token
      Ok(AccessToken.empty.asJson)
    case request @ POST -> Root =>
      // Create new access token
      request.as(jsonOf[AccessToken]).flatMap { bodyAccessToken =>
        val AccessToken(_, token, relation, foreign_id, expires, redacted, _) = bodyAccessToken
        val accessToken = AccessToken.create(token, relation, foreign_id, expires, redacted)
        Created(accessToken.asJson)
      }
    case GET -> Root / IntVar(id) =>
      // Show existing access token
      Ok(AccessToken.find(id).asJson)
    case request @ POST -> Root / IntVar(id) =>
      // Update existing access token
      request.as(jsonOf[AccessToken]).flatMap { bodyAccessToken =>
        val AccessToken(_, token, relation, foreign_id, expires, redacted, _) = bodyAccessToken
        AccessToken.update(id, token, relation, foreign_id, expires, redacted)
        NoContent()
      }
    case DELETE -> Root / IntVar(id) =>
      // Delete existing access token
      AccessToken.delete(id)
      NoContent()
  }
}
