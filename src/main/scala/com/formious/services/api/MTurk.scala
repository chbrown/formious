package com.formious.services.api

import io.finch._
import io.finch.circe._
import com.formious.models.AWSAccount

//import com.amazonaws.mturk

object MTurk {
  /** POST /api/mturk/?aws_account_id=number&environment='production'|'sandbox'
    *
    * The querystring should contain the aws_account.id and the target MTurk environment.
    * `aws_account_id` indicates a record in the AWS Account table, which exposes the
    * AWS Access Key ID and AWS Secret Access Key
    *
    * The POST should contain, minimally, an "Operation" field, indicating the MTurk
    * API operation to call.
    */
  val postRequest: Endpoint[String] = post(param("aws_account_id").as[Int] :: paramOption("environment") :: body) { (aws_account_id: Int, environmentOption: Option[String], body: String) =>
    val environment = environmentOption.getOrElse("production")
    val awsAccount = AWSAccount.find(aws_account_id)

    //var account = new turk.Account(aws_account.access_key_id, aws_account.secret_access_key)
    //var connection = account.createConnection(environment)
    //mturk.service.axis.
    val xml = "Not yet implemented" // connection.post(body)
    Ok(xml).withHeader("Content-Type" -> "text/xml")
  }

  val endpoint = "mturk" :: postRequest
}
