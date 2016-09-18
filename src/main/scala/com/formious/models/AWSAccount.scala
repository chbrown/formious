package com.formious.models

import java.time.ZonedDateTime
import scalikejdbc._, jsr310._

case class AWSAccount(id: Int,
                      name: String,
                      access_key_id: String,
                      secret_access_key: String,
                      created: ZonedDateTime)

object AWSAccount extends SQLSyntaxSupport[AWSAccount] {
  override val tableName = "aws_account"

  def apply(rs: WrappedResultSet) = new AWSAccount(
    rs.get("id"),
    rs.get("name"),
    rs.get("access_key_id"),
    rs.get("secret_access_key"),
    rs.get("created"))

  def empty = new AWSAccount(0, "", "", "", ZonedDateTime.now)

  def all()(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM aws_account ORDER BY id ASC".map(AWSAccount(_)).list.apply()
  }

  def find(id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"SELECT * FROM aws_account WHERE id = $id".map(AWSAccount(_)).single.apply().get
  }

  def allByAdministrator(administrator_id: Int)(implicit session: DBSession = ReadOnlyAutoSession) = {
    sql"""SELECT * FROM aws_accounts
          JOIN aws_account_administrators.aws_account_id = aws_accounts.id
          WHERE aws_account_administrators.administrator_id = $administrator_id
          ORDER BY aws_account_administrators.priority DESC""".map(AWSAccount(_)).list.apply()
  }
}
