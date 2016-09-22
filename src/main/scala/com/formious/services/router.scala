package com.formious.services

import com.twitter.finagle.http.path._
import com.twitter.finagle.http.service.RoutingService
import com.twitter.finagle.http.Request

object router {
  //val adminRedirect: Endpoint[Unit] = get("admin" :: *) {
  //  Output.unit(Status.SeeOther).withHeader("Location" -> "/ui/index.html")
  //}

  // TODO: add global exception handler

  val service = RoutingService.byPathObject[Request] {
    case "api" /: _ => api.service
    // case "echo" /: _ => echo.service
    case "experiments" /: _ => experiments.service
    // case "info" /: _ => info.service
    case "mturk" /: _ => mturk.service
    case "responses" /: _ => responses.service
    case "ui" /: _ => ui.service
    case "util" /: _ => util.service
    //case otherwise =>
    //  Console.err.println(s"No matching route for $otherwise")
  }
}
