package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class Participant(id: Int,
                       name: Option[String],
                       aws_worker_id: Option[String],
                       aws_bonus_owed: math.BigDecimal,
                       aws_bonus_paid: math.BigDecimal,
                       ip_address: Option[String],
                       user_agent: Option[String],
                       created: ZonedDateTime)

object Participant extends SQLSyntaxSupport[Participant] {
  override val tableName = "participant"

  def apply(rs: WrappedResultSet) = new Participant(
    rs.get("id"),
    rs.get("name"),
    rs.get("aws_worker_id"),
    rs.get("aws_bonus_owed"),
    rs.get("aws_bonus_paid"),
    rs.get("ip_address"),
    rs.get("user_agent"),
    rs.get("created"))

  def find(id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM participant WHERE id = $id".map(Participant(_)).single.apply().get
  }

  def findOrCreateByWorkerId(aws_worker_id: String, ip_address: Option[String], user_agent: Option[String])
                            (implicit session: DBSession): Participant = {
    val participant = sql"""
      SELECT * FROM participant WHERE aws_worker_id = $aws_worker_id
    """.map(Participant(_)).single.apply()
    participant.getOrElse {
      sql"""INSERT INTO participant (aws_worker_id, ip_address, user_agent)
            VALUES ($aws_worker_id, $ip_address, $user_agent)
            RETURNING *""".map(Participant(_)).single.apply().get
    }
  }
}
