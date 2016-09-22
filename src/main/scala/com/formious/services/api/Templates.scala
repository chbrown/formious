package com.formious.services.api

import com.formious.models.Template
import scalikejdbc.{delete => _, _}
import io.finch._

object Templates {
  /** GET /api/templates
  List all templates. */
  val listTemplates: Endpoint[List[Template]] = get(/) {
    Ok(Template.all())
  }

  /** GET /api/templates/new
  Generate blank template. */
  val newTemplate: Endpoint[Template] = get("new") {
    Ok(Template.empty)
  }

  private val settableParams = param("name") :: param("html")

  /** POST /api/templates
  Create new template. */
  val createTemplate: Endpoint[Template] = post(settableParams) { (name: String, html: String) =>
    // if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
    //   // 303 is a "See other" and SHOULD include a Location header
    //   return res.status(303).die('Template already exists')
    // }
    val template = DB.localTx { implicit session =>
      withSQL {
        insert.into(Template).namedValues(
          Template.column.name -> name,
          Template.column.html -> html
        ).append(sqls"RETURNING *")
      }.map(Template(_)).single.apply().get
    }
    Created(template)
  }

  /** GET /api/templates/:id
  Show existing template. */
  val showTemplate: Endpoint[Template] = get(int) { (id: Int) =>
    Ok(Template.find(id)).withHeader("Cache-Control", "max-age=5")
  }

  /** POST /api/templates/:id
  Update existing template. */
  val updateTemplate: Endpoint[Unit] = post(int :: settableParams) { (id: Int, name: String, html: String) =>
    DB.localTx { implicit session =>
      withSQL {
        update(Template).set(
          Template.column.name -> name,
          Template.column.html -> html
        ).where.eq(Template.column.id, id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  /** DELETE /api/templates/:id
  Delete existing template. */
  val deleteTemplate: Endpoint[Unit] = post(int) { (id: Int) =>
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(Template).where.eq(Template.column.id, id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  val endpoint = "templates" ::
    (listTemplates :+: newTemplate :+: showTemplate :+: updateTemplate :+: deleteTemplate)
}
