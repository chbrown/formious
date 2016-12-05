package com.formious.services.api

import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import com.formious.models.Experiment
import com.formious.common.Encoders._
import com.formious.common.Decoders._

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

object Experiments {
  case class ExperimentData(name: String,
                            administrator_id: Int,
                            html: String)

  val service = HttpService {
    case GET -> Root =>
      val experiments = Experiment.all
      experiments.foreach { experiment =>
        Experiment.findOrCreateAccessToken(experiment.id)
      }
      Ok(experiments.asJson)
    case GET -> Root / "new" =>
      Ok(ExperimentData("", 0, "").asJson)
    case request @ POST -> Root =>
      request.as(jsonOf[ExperimentData]).flatMap { bodyExperiment =>
        val ExperimentData(name, administrator_id, html) = bodyExperiment
        val experiment = Experiment.create(name, administrator_id, html)
        Created(experiment.asJson)
      }
    case GET -> Root / IntVar(id) =>
      Ok(Experiment.find(id).asJson)
      //Experiment.findOrCreateAccessToken(experiment.id)
      //NotFound(new Exception("Experiment not found"))
    case request @ POST -> Root / IntVar(id) =>
      request.as(jsonOf[Experiment]).flatMap { bodyExperiment =>
        val Experiment(_, name, administrator_id, html, _) = bodyExperiment
        Experiment.update(id, name, administrator_id, html)
        NoContent()
      }
    case DELETE -> Root / IntVar(id) =>
      Experiment.delete(id)
      NoContent()
  }
}
