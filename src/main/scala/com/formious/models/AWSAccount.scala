package com.formious.models

import java.time.ZonedDateTime
import java.sql.ResultSet
import com.formious.common.Database.{query, execute}
import com.formious.common.Recoders._

case class AWSAccount(id: Int,
                      name: String,
                      access_key_id: String,
                      secret_access_key: String,
                      created: ZonedDateTime)

object AWSAccount {
  def apply(row: ResultSet) = new AWSAccount(
    row.getInt("id"),
    row.getString("name"),
    row.getString("access_key_id"),
    row.getString("secret_access_key"),
    row.getTimestamp("created").toZonedDateTime)

  def all = {
    query("SELECT * FROM aws_account ORDER BY id DESC")(AWSAccount(_))
  }

  def find(id: Int) = {
    query("SELECT * FROM aws_account WHERE id = ?", List(id))(AWSAccount(_)).head
  }

  def create(name: String,
             access_key_id: String,
             secret_access_key: String) = {
    query("""
      INSERT INTO aws_account (name, access_key_id, secret_access_key)
      VALUES (?, ?, ?) RETURNING *
    """, List(name, access_key_id, secret_access_key))(AWSAccount(_)).head
  }

  def update(id: Int,
             name: String,
             access_key_id: String,
             secret_access_key: String) = {
    execute("""
      UPDATE aws_account SET name = ?, access_key_id = ?, secret_access_key = ?
      WHERE id = ?
    """, List(name, access_key_id, secret_access_key, id))
  }

  def delete(id: Int) = {
    execute("DELETE FROM aws_account WHERE id = ?", List(id))
  }

  def allByAdministrator(administrator_id: Int) = {
    query("""
      SELECT * FROM aws_accounts
        JOIN aws_account_administrators.aws_account_id = aws_accounts.id
      WHERE aws_account_administrators.administrator_id = ?
      ORDER BY aws_account_administrators.priority DESC
    """, List(administrator_id))(AWSAccount(_))
  }
}
