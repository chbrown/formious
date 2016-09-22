package com.formious.services.api

import com.formious.models.AWSAccount
import scalikejdbc._
import io.finch._

object AWSAccounts {
  /** GET /api/aws_accounts
    * List all AWS accounts. */
  val listAWSAccounts: Endpoint[List[AWSAccount]] = get(/) {
    Ok(AWSAccount.all())
  }

  /** GET /api/aws_accounts/new
    * Generate blank AWS account. */
  val newAWSAccount: Endpoint[AWSAccount] = get("new") {
    Ok(AWSAccount.empty)
  }

  private val settableParams = param("name") :: param("access_key_id") :: param("secret_access_key")

  /** POST /api/aws_accounts
    * Create new AWS account. */
  val createAWSAccount: Endpoint[AWSAccount] = post(settableParams) { (name: String, access_key_id: String, secret_access_key: String) =>
    val awsAccount = DB.localTx { implicit session =>
      withSQL {
        insert.into(AWSAccount).namedValues(
          AWSAccount.column.name -> name,
          AWSAccount.column.access_key_id -> access_key_id,
          AWSAccount.column.secret_access_key -> secret_access_key
        ).append(sqls"RETURNING *")
      }.map(AWSAccount(_)).single.apply().get
    }
    Created(awsAccount)
  }

  /** GET /api/aws_accounts/:id
    * Show existing AWS account. */
  val showAWSAccount: Endpoint[AWSAccount] = get(int) { (id: Int) =>
    Ok(AWSAccount.find(id))
  }

  /** POST /api/aws_accounts/:id
    * Update existing AWS account. */
  val updateAWSAccount: Endpoint[Unit] = post(int :: settableParams) { (id: Int, name: String, access_key_id: String, secret_access_key: String) =>
    DB.localTx { implicit session =>
      withSQL {
        update(AWSAccount).set(
          AWSAccount.column.name -> name,
          AWSAccount.column.access_key_id -> access_key_id,
          AWSAccount.column.secret_access_key -> secret_access_key
        ).where.eq(AWSAccount.column.id, id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  /** DELETE /api/aws_accounts/:id
    * Delete AWS account. */
  val deleteAWSAccount: Endpoint[Unit] = post(int) { (id: Int) =>
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(AWSAccount).where.eq(AWSAccount.column.id, id)
      }.update.apply()
    }
    NoContent[Unit]
  }

  val endpoint = "aws_accounts" ::
    (listAWSAccounts :+: newAWSAccount :+: showAWSAccount :+: updateAWSAccount :+: deleteAWSAccount)
}
