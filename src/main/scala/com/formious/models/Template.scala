package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class Template(id: Int,
                    name: String,
                    html: String,
                    created: ZonedDateTime)

object Template extends SQLSyntaxSupport[Template] {
  override val tableName = "template"

  def apply(rs: WrappedResultSet) = new Template(
    rs.get("id"),
    rs.get("name"),
    rs.get("html"),
    rs.get("created"))

  def empty = new Template(0, "", "", ZonedDateTime.now)

  def all()(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM template ORDER BY id ASC".map(Template(_)).list.apply()
  }

  def find(id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM template WHERE id = $id".map(Template(_)).single.apply().get
  }
}
