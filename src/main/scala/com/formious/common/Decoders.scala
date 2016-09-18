package com.formious.common

import java.time.{Instant, ZoneId, ZonedDateTime}

import cats.data.Xor
import io.circe.Decoder

object Decoders {
  private def parseZonedDateTime(text: String) = {
    val instant = Instant.parse(text)
    ZonedDateTime.ofInstant(instant, ZoneId.systemDefault)
  }

  implicit val decodeInstant: Decoder[Instant] = Decoder.decodeString.emap { string =>
    Xor.catchNonFatal(Instant.parse(string)).leftMap(t => "Instant")
  }

  implicit val decodeZonedDateTime: Decoder[ZonedDateTime] = Decoder.decodeString.emap { string =>
    Xor.catchNonFatal(parseZonedDateTime(string)).leftMap(t => "Instant")
  }
}
