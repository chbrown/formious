package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.Database.query
import com.formious.common.Recoders._

case class AWSAccountAdministrator(id: Int,
                                   aws_account_id: Int,
                                   administrator_id: Int,
                                   priority: Int,
                                   created: ZonedDateTime)

object AWSAccountAdministrator {
  def apply(row: ResultSet) = new AWSAccountAdministrator(
    row.getInt("id"),
    row.getInt("aws_account_id"),
    row.getInt("administrator_id"),
    row.getInt("priority"),
    row.getTimestamp("created").toZonedDateTime)

  def all = {
    query("SELECT * FROM aws_account_administrator")(AWSAccountAdministrator.apply)
  }

  def create(aws_account_id: Int, administrator_id: Int, priority: Option[Int]) = {
    query("""
      INSERT INTO aws_account_administrator (aws_account_id, administrator_id, priority)
      VALUES (?, ?, ?) RETURNING *
    """, List(aws_account_id, administrator_id, priority))(AWSAccountAdministrator.apply).head
  }

  def delete(aws_account_id: Int, administrator_id: Int) = {
    query("""
      DELETE FROM aws_account_administrator
      WHERE aws_account_id = ? AND administrator_id = ?
    """, List(aws_account_id, administrator_id))(AWSAccountAdministrator.apply).head
  }
}
