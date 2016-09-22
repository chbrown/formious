package com.formious.services

import scalikejdbc._
import io.finch._
import com.twitter.util.Duration
import com.twitter.finagle.http.Cookie
import com.formious.models.Administrator

object login {
  /** POST /login
    * Try to login as user with email and password
    * TODO: make artificially slow to deflect brute force attacks
    * setTimeout(function() { ... }, 500) */
  val login: Endpoint[String] = post("login" :: param("email") :: param("password")) { (email: String, password: String) =>
    DB.localTx { implicit session =>
      Administrator.authenticate(email, password)
    } match {
      case Some(accessToken) =>
        // logger.info('%s token = %s', message, token)
        val tokenCookie = new Cookie("administrator_token", accessToken.token)
        tokenCookie.path = "/"
        tokenCookie.maxAge = Duration.fromSeconds(60 * 60 * 24 * 31) // 31 days
        Ok("Authenticated successfully").withCookie(tokenCookie)
      // we serve the login page from GET as well as failed login POSTs
      case _ =>
        Unauthorized(new Exception("Access token failed to match"))
    }
  }

  val service = login.toServiceAs[Text.Plain]
}
