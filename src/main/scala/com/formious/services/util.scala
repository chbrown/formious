package com.formious.services

import com.twitter.finagle.http.Request
import io.finch._
import io.finch.circe._
import com.formious.common.{CSV, Excel}

object util {
  /** POST /util/parse-table
    * Parse csv-like input flexibly and write out json to response */
  val parseTable: Endpoint[List[Map[String, String]]] = post("util" :: "parse-table" :: root :: headerOption("content-type")) { (request: Request, contentType: Option[String]) =>
    val rows = contentType match {
      case Some("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") =>
        request.withInputStream(Excel.streamFirstSheetToMaps)
      //case Some("application/json") =>
      //  parse(body).getOrElse(Json.Null).asArray.get
      case _ => // csv
        request.withReader(CSV.readerToMaps)
    }
    Ok(rows).withHeader("Content-Type" -> "application/json")
  }

  val service = parseTable.toServiceAs[Application.Json]
}
