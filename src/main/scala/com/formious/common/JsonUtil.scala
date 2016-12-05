package com.formious.common

import java.sql.ResultSet

import io.circe.{Json, JsonObject}
import io.circe.parser

object JsonUtil {
  def mergeJsonObjects(a: JsonObject, b: JsonObject): JsonObject = {
    b.toList.foldLeft(a) { case (accumulator, (key, value)) =>
      accumulator.add(key, value)
    }
  }
  def mergeJsonObjects(objects: Iterable[JsonObject]): JsonObject = {
    objects.tail.foldLeft(objects.head)(mergeJsonObjects)
  }

  private def inferJson(resultSet: ResultSet, columnIndex: Int, className: String): Json = {
    val objectValue = resultSet.getObject(columnIndex)
    // anything can be NULL, so we check for that first
    if (objectValue == null) {
      Json.Null
    }
    else {
      className match {
        case "java.lang.Boolean" =>
          Json.fromBoolean(resultSet.getBoolean(columnIndex))
        case "java.lang.Integer" =>
          Json.fromInt(resultSet.getInt(columnIndex))
        case "java.lang.Long" =>
          Json.fromLong(resultSet.getLong(columnIndex))
        case "java.math.BigDecimal" =>
          Json.fromBigDecimal(resultSet.getBigDecimal(columnIndex))
        case "java.lang.Double" =>
          Json.fromDoubleOrString(resultSet.getDouble(columnIndex))
        case "java.lang.String" =>
          Json.fromString(resultSet.getString(columnIndex))
        case "java.lang.Object" =>
          // JSON/JSONB, hopefully
          val jsonString = resultSet.getString(columnIndex)
          parser.parse(jsonString).getOrElse(Json.Null)
        case _ =>
          Json.fromString(resultSet.getString(columnIndex))
      }
    }
  }

  /**
    * getColumnType -> 12 | 93 | 1111 | 2 | etc.
    * getColumnTypeName -> "text" | "timestamptz" | "jsonb" | "numeric" | etc.
    * getColumnLabel -> String of column name only (no dotted notation)
    * getTableName -> String of plain table name
    * getColumnClassName -> "java.lang.String" | "java.sql.Timestamp" | "java.lang.Object" | "java.lang.Integer" | etc.
    * getSchemaName -> always empty
    * getCatalogName -> always empty
    */
  def resultSetToJson(resultSet: ResultSet): JsonObject = {
    val metaData = resultSet.getMetaData
    val numColumns = metaData.getColumnCount
    val fields = (1 to numColumns).map { columnIndex =>
      val key = metaData.getColumnName(columnIndex)
      val value = inferJson(resultSet, columnIndex, metaData.getColumnClassName(columnIndex))
      key -> value
    }
    // or maybe Json.fromFields(fields) to get a plain Json out
    JsonObject.fromIterable(fields)
  }
}
