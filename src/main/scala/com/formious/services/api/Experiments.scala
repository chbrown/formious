package com.formious.services.api

import scalikejdbc.{delete => _, _}
import io.finch._
import io.finch.circe._
import com.formious.models.Experiment

object Experiments {
  /** GET /api/experiments
    * list all experiments */
  val listExperiments: Endpoint[List[Experiment]] = get(/) {
    val experiments = DB.localTx { implicit session =>
      val experiments = Experiment.all()
      experiments.foreach(experiment => Experiment.findOrCreateAccessToken(experiment.id))
      experiments
    }
    Ok(experiments)
  }

  private val settableParams = paramOption("name") :: param("administrator_id").as[Int] :: paramOption("html")

  /** GET /api/experiments/new
    * Generate blank experiment. */
  val newExperiment: Endpoint[Experiment] = get("new") {
    // administrator_id: req.administrator.id,
    Ok(Experiment.empty)
  }

  /** POST /api/experiments
    * Create new experiment. */
  val createExperiment: Endpoint[Experiment] = post(settableParams) { (name: Option[String], administrator_id: Int, html: Option[String]) =>
    val experiment = DB.localTx { implicit session =>
      withSQL {
        insert.into(Experiment).namedValues(
          Experiment.column.name -> name,
          Experiment.column.administrator_id -> administrator_id,
          Experiment.column.html -> html
        ).append(sqls"RETURNING *")
      }.map(Experiment(_)).single.apply().get
    }
    Created(experiment)
  }

  /** GET /api/experiments/:id
    * Show existing experiment. */
  val showExperiment: Endpoint[Experiment] = get(int) { (id: Int) =>
    DB.localTx { implicit session =>
      val experimentOption = sql"""
        SELECT experiments.*, access_tokens.token AS access_token FROM experiments
        LEFT OUTER JOIN access_tokens ON access_tokens.relation = 'experiments' AND access_tokens.foreign_id = experiments.id AND (access_tokens.expires < NOW() OR access_tokens.expires IS NULL) AND access_tokens.redacted IS NULL
        WHERE experiments.id = $id
      """.map(Experiment(_)).single.apply()
      experimentOption match {
        case Some(experiment) => Experiment.findOrCreateAccessToken(experiment.id)
        case None => None
      }
      experimentOption
    } match {
      case Some(experiment) =>
        Ok(experiment)
      case _ =>
        NotFound(new Exception("Experiment not found"))
    }
  }

  /** POST /api/experiments/:id
    * Update existing experiment */
  val updateExperiment: Endpoint[Unit] = post(int :: settableParams) { (id: Int, name: Option[String], administrator_id: Int, html: Option[String]) =>
    DB.localTx { implicit session =>
      withSQL {
        update(Experiment).set(
          Experiment.column.name -> name,
          Experiment.column.administrator_id -> administrator_id,
          Experiment.column.html -> html
        ).where.eq(Experiment.column.id, id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  /** DELETE /api/experiments/:id
    * Delete experiment */
  val deleteExperiment: Endpoint[Unit] = delete(int) { (id: Int) =>
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(Experiment).where.eq(Experiment.column.id, id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  val endpoint = "experiments" ::
    (listExperiments :+: newExperiment :+: showExperiment :+: updateExperiment :+: deleteExperiment)
}
