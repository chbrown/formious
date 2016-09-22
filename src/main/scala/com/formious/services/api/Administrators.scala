package com.formious.services.api

import scalikejdbc.{delete => _, _}
import io.finch._
import com.formious.models.{AWSAccount, AWSAccountAdministrator, Administrator}

object Administrators {
  /** GET /api/administrators
    * List all administrators. */
  val listAdministrators: Endpoint[List[Administrator]] = get(/) {
    Ok(Administrator.all())
  }

  /** GET /api/administrators/new
    * Generate blank administrator. */
  val newAdministrator: Endpoint[Administrator] = get("new") {
    Ok(Administrator.empty)
  }

  /** POST /api/administrators
    * Create new administrator. */
  val createAdministrator: Endpoint[Administrator] = post(param("email") :: param("password")) { (email: String, password: String) =>
    // .add is like .insert, but hashes the password.
    val administrator = DB.localTx { implicit session =>
      Administrator.add(email, password)
    }
    Created(administrator)
  }

  /** GET /api/administrators/:id
    * Show existing administrator. */
  val showAdministrator: Endpoint[Administrator] = get(int) { (administrator_id: Int) =>
    // administrator = _.omit(administrator, "password")
    Ok(Administrator.find(administrator_id))
  }

  /** POST /api/administrators/:id
    * Update existing administrator. */
  val updateAdministrator: Endpoint[Unit] = post(int :: param("email") :: paramOption("password")) { (administrator_id: Int, email: String, password: Option[String]) =>
    // but hashes the password if it is not
    // administrator = _.omit(administrator, "password")
    DB.localTx { implicit session =>
      Administrator.updateCredentials(administrator_id, email, password.filter(!_.isEmpty))
    }
    NoContent[Unit]
  }

  /** DELETE /api/administrators/:administrator_id
    * Delete single administrator */
  val deleteAdministrator: Endpoint[Unit] = post(int) { (administrator_id: Int) =>
    DB.localTx { implicit session =>
      Administrator.delete(administrator_id)
    }
    NoContent[Unit]
  }

  // Administrator <-> AWS Account many2many relationship

  /** GET /api/administrators/:administrator_id/aws_accounts
    * List administrator-AWS accounts linked to this administrator */
  val listLinkedAwsAccounts: Endpoint[List[AWSAccount]] = get(int :: "aws_accounts") { (administrator_id: Int) =>
    val awsAccounts = DB.localTx { implicit session =>
      AWSAccount.allByAdministrator(administrator_id)
    }
    Ok(awsAccounts)
  }

  /** POST /api/administrators/:administrator_id/aws_accounts/:aws_account_id
    * Create administrator-AWS account link */
  val linkAwsAccount: Endpoint[AWSAccountAdministrator] = post(int :: "aws_accounts" :: int :: paramOption("priority")) { (administrator_id: Int, aws_account_id: Int, priority: Option[String]) =>
    val awsAccountAdministrator = DB.localTx { implicit session =>
      AWSAccountAdministrator.create(administrator_id, aws_account_id, priority.map(_.toInt))
    }
    Created(awsAccountAdministrator)
  }

  /** DELETE /api/administrators/:administrator_id/aws_accounts/:aws_account_id
    * Delete administrator-AWS account link */
  val unlinkAwsAccount: Endpoint[Unit] = delete(int :: "aws_accounts" :: int) { (administrator_id: Int, aws_account_id: Int) =>
    DB.localTx { implicit session =>
      sql"""DELETE FROM aws_account_administrator
            WHERE administrator_id = $administrator_id AND
                  aws_account_id = $aws_account_id""".update.apply()
    }
    Console.err.println("Disowned AWS account")
    NoContent[Unit]
  }

  val endpoint = "administrators" ::
    (listAdministrators :+: newAdministrator :+: createAdministrator :+: showAdministrator :+: updateAdministrator :+: deleteAdministrator :+: listLinkedAwsAccounts :+: linkAwsAccount :+: unlinkAwsAccount)
}
