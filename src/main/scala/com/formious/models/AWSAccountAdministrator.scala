package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class AWSAccountAdministrator(id: Int,
                                   aws_account_id: Int,
                                   administrator_id: Int,
                                   priority: Int,
                                   created: ZonedDateTime)

object AWSAccountAdministrator extends SQLSyntaxSupport[AWSAccountAdministrator] {
  override val tableName = "aws_account_administrator"

  def apply(rs: WrappedResultSet) = new AWSAccountAdministrator(
    rs.get("id"),
    rs.get("aws_account_id"),
    rs.get("administrator_id"),
    rs.get("priority"),
    rs.get("created"))

  def all()(implicit session: DBSession = ReadOnlyAutoSession): Seq[AWSAccountAdministrator] = {
    sql"SELECT * FROM aws_account_administrator".map(AWSAccountAdministrator(_)).list.apply()
  }

  def create(aws_account_id: Int, administrator_id: Int, priority: Option[Int])
            (implicit session: DBSession): AWSAccountAdministrator = {
    sql"""INSERT INTO aws_account_administrator (administrator_id, aws_account_id, priority)
          VALUES ($administrator_id, $aws_account_id, $priority)
          RETURNING *""".map(AWSAccountAdministrator(_)).single.apply().get
  }
}
