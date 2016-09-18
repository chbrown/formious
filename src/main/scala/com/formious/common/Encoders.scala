package com.formious.common

import java.time.{Instant, ZonedDateTime}

import io.circe.{Encoder, Json}

object Encoders {
  implicit val instantEncoder: Encoder[Instant] =
    Encoder.instance(instant => Json.fromString(instant.toString))

  // ZonedDateTime's toString looks like "2016-07-04T13:41:28.365-05:00[America/Chicago]"
  // zonedDateTime.toOffsetDateTime.toString would probably work just as well
  implicit val zonedDateTimeEncoder: Encoder[ZonedDateTime] =
    Encoder.instance(zonedDateTime => Json.fromString(zonedDateTime.toInstant.toString))
}
