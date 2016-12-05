package com.formious.common

import java.sql.Timestamp
import java.time.{Instant, ZoneId, ZonedDateTime}

object Recoders {
  implicit class timestampOps(val timestamp: Timestamp) extends AnyVal {
    def toZonedDateTime: ZonedDateTime = {
      val millis = timestamp.getTime
      // TODO: use timestamp.getNanos for higher precision
      val instant = Instant.ofEpochMilli(millis)
      // TODO: verify that this timezone handling is correct
      ZonedDateTime.ofInstant(instant, ZoneId.systemDefault)
    }
  }
  implicit class zonedDateTimeOps(val zonedDateTime: ZonedDateTime) extends AnyVal {
    def toTimestamp: Timestamp = {
      Timestamp.from(zonedDateTime.toInstant)
    }
  }
}
