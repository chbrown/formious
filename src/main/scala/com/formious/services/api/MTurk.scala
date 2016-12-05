package com.formious.services.api

import com.formious.models.AWSAccount

import org.http4s._
import org.http4s.dsl._

import com.amazonaws.mturk.service.axis.RequesterService
import com.amazonaws.mturk.util.ClientConfig

object MTurk {
  object AWSAccountId extends QueryParamDecoderMatcher[Int]("aws_account_id")
  object Environment extends OptionalQueryParamDecoderMatcher[String]("environment")

  val service = HttpService {
    case request @ POST -> Root :? AWSAccountId(aws_account_id) +& Environment(environmentOption) =>
      // POST /api/mturk/?aws_account_id=number&environment='production'|'sandbox'
      //
      // The querystring should contain the aws_account.id and the target MTurk environment.
      // `aws_account_id` indicates a record in the AWS Account table, which exposes the
      // AWS Access Key ID and AWS Secret Access Key
      //
      // The POST should contain, minimally, an "Operation" field, indicating the MTurk
      // API operation to call.
      val config = new ClientConfig()
      //retriable_errors=Server.ServiceUnavailable
      //retry_attempts=10
      //retry_delay_millis=1000
      environmentOption match {
        case Some("sandbox") => config.setServiceURL(ClientConfig.SANDBOX_SERVICE_URL)
        case _ => config.setServiceURL(ClientConfig.PRODUCTION_SERVICE_URL)
      }
      val awsAccount = AWSAccount.find(aws_account_id)
      config.setAccessKeyId(awsAccount.access_key_id)
      config.setSecretAccessKey(awsAccount.secret_access_key)
      val service = new RequesterService(config)

      //val hit = service.createHIT(title, description, reward,
      //  RequesterService.getBasicFreeTextQuestion("What is the weather like right now in Seattle, WA?"), numAssignments)

      //var account = new turk.Account(aws_account.access_key_id, aws_account.secret_access_key)
      //var connection = account.createConnection(environment)

      request.as[String].flatMap { body =>
        val xml = "Not yet implemented: " + service.toString // connection.post(body)
        Ok(xml).putHeaders(Header("Content-Type", "text/xml"))
      }
  }
}
