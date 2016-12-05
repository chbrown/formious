package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.Database.{query, execute}
import com.formious.common.Recoders._

case class AccessToken(id: Int,
                       token: String,
                       relation: String,
                       foreign_id: Int,
                       expires: Option[ZonedDateTime],
                       redacted: Option[ZonedDateTime],
                       created: ZonedDateTime)

object AccessToken {
  def apply(row: ResultSet) = new AccessToken(
    row.getInt("id"),
    row.getString("token"),
    row.getString("relation"),
    row.getInt("foreign_id"),
    Option(row.getTimestamp("expires")).map(_.toZonedDateTime),
    Option(row.getTimestamp("redacted")).map(_.toZonedDateTime),
    row.getTimestamp("created").toZonedDateTime)

  def empty = new AccessToken(0, "", "", 0, None, None, ZonedDateTime.now)

  private val randomTokenStore = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

  private def createRandomString(length: Int) = {
    List.fill(length) {
      scala.util.Random.nextInt(randomTokenStore.length)
    }.map(randomTokenStore).mkString
  }

  def all = {
    query("SELECT * FROM access_token ORDER BY id ASC")(AccessToken(_))
  }

  def create(token: String,
             relation: String,
             foreign_id: Int,
             expires: Option[ZonedDateTime] = None,
             redacted: Option[ZonedDateTime] = None) = {
    query("""
      INSERT INTO access_token (token, relation, foreign_id, expires, redacted)
      VALUES (?, ?, ?, ?, ?) RETURNING *
    """, List(token, relation, foreign_id, expires, redacted))(AccessToken(_)).head
  }

  def createRandom(relation: String,
                   foreign_id: Int,
                   length: Int = 40,
                   expires: Option[ZonedDateTime] = None,
                   redacted: Option[ZonedDateTime] = None) = {
    val token = createRandomString(length)
    create(token, relation, foreign_id, expires, redacted)
  }

  def update(id: Int,
             token: String,
             relation: String,
             foreign_id: Int,
             expires: Option[ZonedDateTime] = None,
             redacted: Option[ZonedDateTime] = None) = {
    execute("""
      UPDATE access_token
      SET token = ?, relation = ?, foreign_id = ?, expires = ?, redacted = ?
      WHERE id = ?
    """, List(token, relation, foreign_id, expires, redacted, id))
  }

  def check(token: String, relation: String, foreign_id: Int) = {
    // TODO: generalize this for use in findOrCreate (which doesn't use the token)
    query("""
      SELECT * FROM access_token
      WHERE token = ?
        AND relation = ?
        AND foreign_id = ?
        AND (expires IS NULL OR expires > NOW())
        AND redacted IS NULL
    """, List(token, relation, foreign_id))(AccessToken(_)).headOption
  }

  def find(id: Int) = {
    query("SELECT * FROM access_token WHERE id = ?", List(id))(AccessToken(_)).head
  }

  def delete(id: Int) = {
    execute("DELETE FROM access_token WHERE id = ?", List(id))
  }

  /**
    * @param relation   A table name
    * @param foreign_id Pointer to the "id" column on the table denoted by the "relation" field
    */
  def findOrCreate(relation: String, foreign_id: Int, length: Int = 40, expires: Option[ZonedDateTime] = None) = {
    // TODO: convert to upsert
    val accessTokenOption = query("""
      SELECT * FROM access_token
      WHERE relation = ?
        AND foreign_id = ?
        AND (expires IS NULL OR expires > NOW())
        AND redacted IS NULL
    """, List(relation, foreign_id))(AccessToken(_)).headOption
    accessTokenOption.getOrElse {
      val token = createRandomString(length)
      create(token, relation, foreign_id)
    }
  }
}
