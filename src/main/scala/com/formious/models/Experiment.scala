package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.Database.{query, execute}
import com.formious.common.Recoders._

case class Experiment(id: Int,
                      name: String,
                      administrator_id: Int,
                      html: String,
                      created: ZonedDateTime)

object Experiment {
  def apply(row: ResultSet) = new Experiment(
    row.getInt("id"),
    row.getString("name"),
    row.getInt("administrator_id"),
    row.getString("html"),
    row.getTimestamp("created").toZonedDateTime)

  def all = {
    query("SELECT * FROM experiment ORDER BY id ASC") { Experiment(_) }
  }

  def find(id: Int) = {
    query("SELECT * FROM experiment WHERE id = ?", List(id)) { Experiment(_) }.head
  }

  def findOrCreateAccessToken(id: Int, length: Int = 12, expires: Option[ZonedDateTime] = None) = {
    AccessToken.findOrCreate("experiments", id, length, expires)
  }

  def create(name: String,
             administrator_id: Int,
             html: String) = {
    query("""
      INSERT INTO experiment (name, administrator_id, html)
      VALUES (?, ?, ?) RETURNING *
    """, List(name, administrator_id, html)) { Experiment(_) }.head
  }

  def update(id: Int,
             name: String,
             administrator_id: Int,
             html: String) = {
    execute("""
      UPDATE experiment SET name = ?, administrator_id = ?, html = ?
      WHERE id = ?
    """, List(name, administrator_id, html, id))
  }

  def delete(id: Int) = {
    execute("DELETE FROM experiment WHERE id = ?", List(id))
  }
}
