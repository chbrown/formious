package com.formious.services.api

import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._

import io.circe._
import io.circe.generic.auto._
import io.circe.syntax.EncoderOps

import org.slf4j.LoggerFactory

import com.amazonaws.mturk.service.axis.RequesterService
import com.amazonaws.mturk.util.ClientConfig

import com.formious.models.AWSAccount

object MTurk {
  object AWSAccountId extends QueryParamDecoderMatcher[Int]("aws_account_id")
  object Environment extends OptionalQueryParamDecoderMatcher[String]("environment")

  private val logger = LoggerFactory.getLogger("com.formious.sql")

  val service = HttpService {
    //case POST -> Root / "GetAccountBalance" =>

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

      request.as(jsonOf[Map[String, String]]).flatMap { bodyMap =>
        logger.info(s"bodyMap: $bodyMap")
        bodyMap.get("Operation") match {
          case Some("GetAccountBalance") =>
            Ok(service.getAccountBalance.asJson)
          //val hit = service.createHIT(title, description, reward,
          //  RequesterService.getBasicFreeTextQuestion("What is the weather like right now in Seattle, WA?"), numAssignments)
          case _ =>
            val xml = "Not yet implemented: " + service.toString // connection.post(body)
            Ok(xml).putHeaders(Header("Content-Type", "text/xml"))
        }
      }

  }
}
