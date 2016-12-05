package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.Database.{query, execute}
import com.formious.common.Recoders._

case class Template(id: Int,
                    name: String,
                    html: String,
                    created: ZonedDateTime)

object Template {
  def apply(row: ResultSet) = new Template(
    row.getInt("id"),
    row.getString("name"),
    row.getString("html"),
    row.getTimestamp("created").toZonedDateTime)

  def all = {
    query("SELECT * FROM template ORDER BY id ASC") { Template(_) }
  }

  def find(id: Int) = {
    query("SELECT * FROM template WHERE id = ?", List(id)) { Template(_) }.head
  }

  def create(name: String,
             html: String) = {
    query("""
      INSERT INTO template (name, html)
      VALUES (?, ?) RETURNING *
    """, List(name, html)) { Template(_) }.head
  }

  def update(id: Int,
             name: String,
             html: String) = {
    execute("""
      UPDATE template SET name = ?, html = ?
      WHERE id = ?
    """, List(name, html, id))
  }

  def delete(id: Int) = {
    execute("DELETE FROM template WHERE id = ?", List(id))
  }
}
