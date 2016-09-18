package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class Administrator(id: Int,
                         email: String,
                         password: String,
                         created: ZonedDateTime)

object Administrator extends SQLSyntaxSupport[Administrator] {
  override val tableName = "administrator"

  def apply(rs: WrappedResultSet) = new Administrator(
    rs.get("id"),
    rs.get("email"),
    rs.get("password"),
    rs.get("created"))

  def empty = new Administrator(0, "", "", ZonedDateTime.now)

  private val saltBytes = "rNxROdgCbAkBI2WvZJtH".getBytes("UTF-8")

  private def createSHA256(string: String) = {
    val md = java.security.MessageDigest.getInstance("SHA-256")
    md.update(saltBytes)
    md.update(string.getBytes("UTF-8"))
    val digestBytes = md.digest()
    javax.xml.bind.DatatypeConverter.printHexBinary(digestBytes)
  }

  def all()(implicit session: DBSession = ReadOnlyAutoSession): List[Administrator] = {
    sql"SELECT * FROM administrator ORDER BY created DESC".map(Administrator(_)).list.apply()
  }

  def find(id: Int)(implicit session: DBSession = ReadOnlyAutoSession): Administrator = {
    sql"SELECT * FROM administrator WHERE id = $id".map(Administrator(_)).single.apply().get
  }

  def delete(id: Int)(implicit session: DBSession) = {
    sql"""DELETE FROM administrators WHERE id = $id""".update.apply()
  }

  def add(email: String, password: String)(implicit session: DBSession): Administrator = {
    val hashed_password = createSHA256(password)
    sql"""INSERT INTO administrator (email, password)
          VALUES ($email, $hashed_password)
          RETURNING *""".map(Administrator(_)).single.apply().get
  }

  /**
    * Hashes and sets the password if it is not None
    */
  def updateCredentials(id: Int,
                        email: String,
                        passwordOption: Option[String])
                       (implicit session: DBSession) = {
    val col = Administrator.column // Administrator.syntax("col")
    withSQL {
      val query = update(Administrator).set(col.email -> email)
      val query2 = passwordOption match {
        case Some(password) =>
          query.set(col.password -> Administrator.createSHA256(password))
        case _ => query
      }
      query2.where.eq(col.id, id)
      //.append(sql"RETURNING *")
    }.update.apply()
    //  .map(Administrator(_)).single.apply().get
  }

  def authenticate(email: String, password: String)
                  (implicit session: DBSession): Option[AccessToken] = {
    val hashed_password = createSHA256(password)
    val administrator = sql"""SELECT * FROM administrator
      WHERE email = $email AND password = $hashed_password""".map(Administrator(_)).single.apply()
    administrator.map { administrator =>
      val accessToken = AccessToken.findOrCreate("administrators", administrator.id, 40)
      Console.err.println(s"Authenticated administrator '${administrator.id}' and inserted token '${accessToken.token}'")
      accessToken
    }
  }

  /** Get administrator object from token.
    *
    * @return None if no access token matched or if no administrator is linked to that token
    */
  def fromToken(token: String)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"""
      SELECT * FROM access_token
      WHERE token = $token
        AND relation = 'administrators'
        AND (expires IS NULL OR expires > NOW())
    """.map(AccessToken(_)).single.apply().map { accessToken =>
      Console.err.println(s"Authenticating administrator for token '${accessToken.token}'")
      sql"SELECT * FROM administrator WHERE id = ${accessToken.foreign_id}".map(Administrator(_)).single.apply().get
    }
  }
}
