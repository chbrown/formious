package com.formious.services

import io.circe.generic.auto._

import com.formious.models.Administrator

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object login {
  case class Credentials(email: String, password: String)

  val service = HttpService {
    case request @ POST -> Root =>
      // Try to login as user with email and password
      // TODO: make artificially slow to deflect brute force attacks
      // setTimeout(function() { ... }, 500)
      request.as(jsonOf[Credentials]).flatMap { case Credentials(email: String, password: String) =>
        Administrator.authenticate(email, password) match {
          case Some(accessToken) =>
            // logger.info('%s token = %s', message, token)
            //val tokenCookie = new Cookie()
            //tokenCookie.path = "/"
            //tokenCookie.maxAge = Duration.fromSeconds(60 * 60 * 24 * 31) // 31 days
            Ok("Authenticated successfully").addCookie("administrator_token", accessToken.token, None)
          case _ =>
            // we serve the login page from GET as well as failed login POSTs
            Unauthorized(Challenge("Basic", "Admin Realm"))
        }
      }
  }
}
