package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class AccessToken(id: Int,
                       token: String,
                       relation: String,
                       foreign_id: Int,
                       expires: Option[ZonedDateTime],
                       redacted: Option[ZonedDateTime],
                       created: ZonedDateTime)

object AccessToken extends SQLSyntaxSupport[AccessToken] {
  override val tableName = "access_token"

  def apply(rs: WrappedResultSet) = new AccessToken(
    rs.get("id"),
    rs.get("token"),
    rs.get("relation"),
    rs.get("foreign_id"),
    rs.get("expires"),
    rs.get("redacted"),
    rs.get("created"))

  def empty = new AccessToken(0, "", "", 0, None, None, ZonedDateTime.now)

  private val randomTokenStore = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

  private def createRandomString(length: Int) = {
    List.fill(length) {
      scala.util.Random.nextInt(randomTokenStore.length)
    }.map(randomTokenStore).mkString
  }

  def all()(implicit session: DBSession = ReadOnlyAutoSession): List[AccessToken] = {
    sql"SELECT * FROM access_token ORDER BY id ASC".map(AccessToken(_)).list.apply()
  }

  def create(token: String,
             relation: String,
             foreign_id: Int,
             expires: Option[ZonedDateTime] = None,
             redacted: Option[ZonedDateTime] = None)
            (implicit session: DBSession): AccessToken = {
    withSQL {
      insert.into(AccessToken).namedValues(
        AccessToken.column.token -> token,
        AccessToken.column.relation -> relation,
        AccessToken.column.foreign_id -> foreign_id,
        AccessToken.column.expires -> expires,
        AccessToken.column.redacted -> redacted
      ).append(sqls"RETURNING *")
    }.map(AccessToken(_)).single.apply().get
  }

  def createRandom(length: Int = 40,
                   relation: String,
                   foreign_id: Int,
                   expires: Option[ZonedDateTime] = None,
                   redacted: Option[ZonedDateTime] = None)
                  (implicit session: DBSession): AccessToken = {
    val token = createRandomString(length)
    create(token, relation, foreign_id, expires, redacted)
  }

  def update(id: Int,
             token: String,
             relation: String,
             foreign_id: Int,
             expires: Option[ZonedDateTime] = None,
             redacted: Option[ZonedDateTime] = None)
            (implicit session: DBSession) = {
    withSQL {
      scalikejdbc.update(AccessToken).set(
        AccessToken.column.token -> token,
        AccessToken.column.relation -> relation,
        AccessToken.column.foreign_id -> foreign_id,
        AccessToken.column.expires -> expires,
        AccessToken.column.redacted -> redacted
      ).where.eq(AccessToken.column.id, id)
    }.update.apply()
  }

  def check(token: String, relation: String, foreign_id: Int)
           (implicit session: DBSession = ReadOnlyAutoSession) = {
    // TODO: generalize this for use in findOrCreate too
    val access_token = AccessToken.syntax("access_token")
    withSQL {
      select.from(AccessToken as access_token)
        .where
        .eq(access_token.token, token)
        .and.eq(access_token.relation, relation)
        .and.withRoundBracket {
        _.isNull(access_token.expires).or.gt(access_token.expires, sqls"NOW()") // now not sql"NOW()" ?
      }
        .and.isNull(access_token.redacted)
        .and.eq(access_token.foreign_id, foreign_id)
    }.map(AccessToken(_)).single.apply()
  }

  def find(id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    val access_token = AccessToken.syntax("access_token")
    withSQL {
      select.from(AccessToken as access_token).where.eq(access_token.id, id)
    }.map(AccessToken(_)).single.apply().get
  }

  def delete(id: Int)(implicit session: DBSession) = {
    // sql"""DELETE FROM administrators WHERE id = $id""".update.apply()
    withSQL {
      deleteFrom(AccessToken).where.eq(AccessToken.column.id, id)
    }.update.apply()
  }

  /**
    *
    * @param relation   A table name
    * @param foreign_id Pointer to the "id" column on the table denoted by the "relation" field
    */
  def findOrCreate(relation: String, foreign_id: Int, length: Int = 40, expires: Option[ZonedDateTime] = None)
                  (implicit session: DBSession): AccessToken = {
    // TODO: convert to upsert
    val accessToken = sql"""
      SELECT * FROM access_token
      WHERE relation = $relation AND foreign_id = $foreign_id
        AND (expires IS NULL OR expires > NOW())
        AND redacted IS NULL
    """.map(AccessToken(_)).single.apply()
    accessToken.getOrElse {
      val token = createRandomString(length)
      sql"""INSERT INTO access_token (token, relation, foreign_id, expires)
        VALUES ($token, $relation, $foreign_id, $expires)
        RETURNING *""".map(AccessToken(_)).single.apply().get
    }
  }
}
