package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class Experiment(id: Int,
                      name: String,
                      administrator_id: Int,
                      html: String,
                      created: ZonedDateTime)

object Experiment extends SQLSyntaxSupport[Experiment] {
  override val tableName = "experiment"

  def apply(rs: WrappedResultSet) = new Experiment(
    rs.get("id"),
    rs.get("name"),
    rs.get("administrator_id"),
    rs.get("html"),
    rs.get("created"))

  def empty = new Experiment(0, "", 0, "", ZonedDateTime.now)

  def all()(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM experiment ORDER BY id".map(Experiment(_)).list.apply()
  }

  def find(id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM experiment WHERE id = $id".map(Experiment(_)).single.apply().get
  }

  def findOrCreateAccessToken(id: Int, length: Int = 12, expires: Option[ZonedDateTime] = None)(implicit session: DBSession) = {
    AccessToken.findOrCreate("experiments", id, length, expires)
  }
}
