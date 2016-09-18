package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class Response(id: Int,
                    participant_id: Int,
                    block_id: Int,
                    data: String,
                    assignment_id: Option[String],
                    created: ZonedDateTime)

object Response extends SQLSyntaxSupport[Response] {
  override val tableName = "response"

  def apply(rs: WrappedResultSet) = new Response(
    rs.get("id"),
    rs.get("participant_id"),
    rs.get("block_id"),
    rs.get("data"),
    rs.get("assignment_id"),
    rs.get("created"))

  def find(id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM response WHERE id = $id".map(Response(_)).single.apply().get
  }

  def insert(participant_id: Int,
             block_id: Int,
             data: String = "{}",
             assignment_id: Option[String] = None)(implicit session: DBSession) = {
    sql"""INSERT INTO response (participant_id, block_id, data, assignment_id)
          VALUES ($participant_id, $block_id, $data, $assignment_id)
          RETURNING *""".map(Response(_)).single.apply().get
  }

  def whereParticipant(participant_id: Int)
                      (implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM response WHERE participant_id = $participant_id".map(Response(_)).list.apply()
  }

  def allWhere(limit: Int, experiment_id: Option[Int], template_id: Option[Int], aws_worker_id: Option[String])
              (implicit session: DBSession = ReadOnlyAutoSession): List[Response] = {
    sql"""
      SELECT *
        FROM response
          INNER JOIN participant ON participant.id = response.participant_id
          INNER JOIN block ON block.id = response.block_id
        WHERE (block.experiment_id = $experiment_id OR $experiment_id IS NULL)
          AND (block.template_id = $template_id OR $template_id IS NULL)
          AND (participant.aws_worker_id = $aws_worker_id OR $aws_worker_id IS NULL)
    """.map(Response(_)).list.apply()
  }
}
