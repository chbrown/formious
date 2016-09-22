package com.formious.services.api

import java.time.ZonedDateTime

import scalikejdbc._
import io.finch._
import io.finch.circe._
import com.formious.models.AccessToken
import com.formious.common.Decoders._

object AccessTokens {

  /** GET /api/access_tokens
    * List all access tokens. */
  val listAccessTokens: Endpoint[List[AccessToken]] = get(/) {
    Ok(AccessToken.all())
  }

  /** GET /api/access_tokens/new
    * Generate blank access token. */
  val newAccessToken: Endpoint[AccessToken] = get("new") {
    Ok(AccessToken.empty)
  }

  val settableParams = param("token") :: param("relation") :: param("foreign_id").as[Int] ::
    paramOption("expires").as[ZonedDateTime] :: paramOption("redacted").as[ZonedDateTime]

  /** POST /api/access_tokens
    * Create new access token. */
  val createAccessToken: Endpoint[AccessToken] = post(settableParams) { (token: String, relation: String, foreign_id: Int, expires: Option[ZonedDateTime], redacted: Option[ZonedDateTime]) =>
    val accessToken = DB.localTx { implicit session =>
      AccessToken.create(token, relation, foreign_id, expires, redacted)
    }
    Created(accessToken)
  }

  /** GET /api/access_tokens/:id
    * Show existing access token. */
  val showAccessToken: Endpoint[AccessToken] = get(int) { (id: Int) =>
    Ok(AccessToken.find(id))
  }

  /** POST /api/access_tokens/:id
    * Update existing access token. */
  val updateAccessToken: Endpoint[Unit] = post(int :: settableParams) { (id: Int, token: String, relation: String, foreign_id: Int, expires: Option[ZonedDateTime], redacted: Option[ZonedDateTime]) =>
    DB.localTx { implicit session =>
      AccessToken.update(id, token, relation, foreign_id, expires, redacted)
    }
    NoContent[Unit]
  }

  /** DELETE /api/access_tokens/:id
    * Delete existing access token. */
  val deleteAccessToken: Endpoint[Unit] = post(int) { (id: Int) =>
    DB.localTx { implicit session => AccessToken.delete(id) }
    NoContent[Unit]
  }

  val endpoint = "access_tokens" ::
    (listAccessTokens :+: newAccessToken :+: showAccessToken :+: updateAccessToken :+: deleteAccessToken)
}
