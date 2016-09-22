package com.formious.services

import io.finch._
import io.finch.circe._
import io.circe.generic.auto._

import com.formious.common.Encoders._

package object api {
  // the encoders must be implicitly available exactly when we convert the Finch Endpoint to a Finagle Service
  val service = ("api" :: (
    api.AccessTokens.endpoint :+:
      api.Administrators.endpoint :+:
      api.AWSAccounts.endpoint :+:
      api.Experiments.endpoint :+:
      api.ExperimentBlocks.endpoint :+:
      api.MTurk.endpoint :+:
      api.Responses.endpoint :+:
      api.Templates.endpoint)).toService
}
