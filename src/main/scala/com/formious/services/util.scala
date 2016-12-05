package com.formious.services

import java.io.{InputStream, InputStreamReader, BufferedReader}

import io.circe.syntax.EncoderOps
import org.http4s._
import org.http4s.dsl._
import org.http4s.circe._
import com.formious.common.{CSV, Excel}

object util {
  /**
    * I doubt this is the right way to do it, but a request is like an input stream.
    * This (or the right way) should be in the library!
    * Based on https://github.com/http4s/http4s/issues/634
    */
  implicit val inputStreamDecoder: EntityDecoder[InputStream] = EntityDecoder.decodeBy(MediaRange.`*/*`) { msg =>
    // import java.io.{Reader, PipedInputStream, PipedOutputStream}
    //val inputStream = new PipedInputStream()
    //DecodeResult.success(msg.body.to(scalaz.stream.io.chunkW(new PipedOutputStream(inputStream))).run).map(_ => inputStream)
    DecodeResult.success(scalaz.stream.io.toInputStream(msg.body))
  }

  val service = HttpService {
    case request @ POST -> Root / "parse-table" =>
      // Parse csv-like input flexibly and write out json to response
      val contentType: Option[String] = request.headers.get("content-type".ci).map(_.value)
      val rows = contentType match {
        case Some("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") =>
          //request.as[InputStream].map { inputStream => ... }
          val inputStream = scalaz.stream.io.toInputStream(request.body)
          Excel.streamFirstSheetToMaps(inputStream)
        //case Some("application/json") =>
        //  parse(body).getOrElse(Json.Null).asArray.get
        case _ => // csv
          val inputStream = scalaz.stream.io.toInputStream(request.body)
          val reader = new BufferedReader(new InputStreamReader(inputStream))
          CSV.readerToMaps(reader)
          // TODO: close inputStream properly
      }
      Ok(rows.asJson).putHeaders(Header("Content-Type", "application/json"))
  }
}
