package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.logger
import com.formious.common.Database.{query, execute}
import com.formious.common.Recoders._

case class Administrator(id: Int,
                         email: String,
                         password: String,
                         created: ZonedDateTime)

object Administrator {
  def apply(row: ResultSet) = new Administrator(
    row.getInt("id"),
    row.getString("email"),
    row.getString("password"),
    row.getTimestamp("created").toZonedDateTime)

  private val saltBytes = "rNxROdgCbAkBI2WvZJtH".getBytes("UTF-8")

  private def createSHA256(string: String) = {
    val md = java.security.MessageDigest.getInstance("SHA-256")
    md.update(saltBytes)
    md.update(string.getBytes("UTF-8"))
    val digestBytes = md.digest()
    javax.xml.bind.DatatypeConverter.printHexBinary(digestBytes)
  }

  def all = {
    query("SELECT * FROM administrator ORDER BY created DESC") { Administrator(_) }
  }

  def find(id: Int) = {
    query("SELECT * FROM administrator WHERE id = ?", List(id)) { Administrator(_) }.head
  }

  def delete(id: Int) = {
    execute("DELETE FROM access_token WHERE id = ?", List(id))
  }

  def create(email: String, password: String) = {
    val hashedPassword = createSHA256(password)
    query("""
      INSERT INTO administrator (email, password) FROM
      VALUES (?, ?) RETURNING *
    """, List(email, hashedPassword)) { Administrator(_) }.head
  }

  /**
    * Hashes and sets the password if it is not None
    */
  def updateCredentials(id: Int,
                        email: String,
                        passwordOption: Option[String]) = {
    passwordOption match {
      case Some(password) =>
        val hashedPassword = createSHA256(password)
        execute("""
          UPDATE administrator SET email = ?, password = ? WHERE id = ?
        """, List(email, hashedPassword, id))
      case _ =>
        execute("""
          UPDATE administrator SET email = ? WHERE id = ?
        """, List(email, id))
    }
    // "RETURNING *"
  }

  def authenticate(email: String, password: String) = {
    val hashedPassword = createSHA256(password)
    query("""
      SELECT * FROM administrator WHERE email = ? AND password = ?
    """, List(email, hashedPassword)) { Administrator(_) }.headOption.map { administrator =>
      logger.debug(s"Authenticating administrator '${administrator.id}' and with new or existing token")
      AccessToken.findOrCreate("administrators", administrator.id, 40)
    }
  }

  /** Get administrator object from token.
    *
    * @return None if no access token matched or if no administrator is linked to that token
    */
  def fromToken(token: String) = {
    query("""
      SELECT * FROM access_token
      WHERE token = ?
        AND relation = 'administrators'
        AND (expires IS NULL OR expires > NOW())
    """, token)(AccessToken(_)).headOption.map { accessToken =>
      logger.debug(s"Authenticating administrator for token '${accessToken.token}'")
      find(accessToken.foreign_id)
    }
  }
}
