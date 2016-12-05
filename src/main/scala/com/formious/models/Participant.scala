package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.Database.query
import com.formious.common.Recoders._

case class Participant(id: Int,
                       name: Option[String],
                       aws_worker_id: Option[String],
                       aws_bonus_owed: math.BigDecimal,
                       aws_bonus_paid: math.BigDecimal,
                       ip_address: Option[String],
                       user_agent: Option[String],
                       created: ZonedDateTime)

object Participant {
  def apply(row: ResultSet) = new Participant(
    row.getInt("id"),
    Option(row.getString("name")),
    Option(row.getString("aws_worker_id")),
    row.getBigDecimal("aws_bonus_owed"),
    row.getBigDecimal("aws_bonus_paid"),
    Option(row.getString("ip_address")),
    Option(row.getString("user_agent")),
    row.getTimestamp("created").toZonedDateTime)

  def find(id: Int) = {
    query("SELECT * FROM participant WHERE id = ?", List(id))(Participant(_)).head
  }

  def create(aws_worker_id: String, ip_address: Option[String], user_agent: Option[String]) = {
    query("""
      INSERT INTO participant (aws_worker_id, ip_address, user_agent)
      VALUES (?, ?, ?)
      RETURNING *
    """, List(aws_worker_id, ip_address, user_agent))(Participant(_)).head
  }

  def findOrCreateByWorkerId(aws_worker_id: String, ip_address: Option[String], user_agent: Option[String]) = {
    query("""
      SELECT * FROM participant WHERE aws_worker_id = ?
    """, List(aws_worker_id))(Participant(_)).headOption.getOrElse {
      create(aws_worker_id, ip_address, user_agent)
    }
  }

  def findOrCreate(participantIdOption: Option[Int], workerIdOption: Option[String]) = {
    (participantIdOption, workerIdOption) match {
      case (Some(participantId), _) => Some(find(participantId))
      case (_, Some(workerId)) => Some(findOrCreateByWorkerId(workerId, None, None))
      case _ => None
    }
  }
}
