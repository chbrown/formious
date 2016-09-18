package com.formious.common

import java.io.Reader

import org.supercsv.io.CsvMapReader
import org.supercsv.prefs.CsvPreference

import scala.collection.mutable.ListBuffer

import scala.collection.JavaConversions._

object CSV {
  def readerToMaps(reader: Reader) = {
    val mapReader = new CsvMapReader(reader, CsvPreference.STANDARD_PREFERENCE)
    val header = mapReader.getHeader(false)
    // it's surprisingly hard to mold the CsvMapReader interface into something Scala-like!
    val rows = ListBuffer.empty[Map[String, String]]
    var row: java.util.Map[String, String] = null
    do {
      row = mapReader.read(header:_*)
      if (row != null) {
        rows.append(row.toMap)
      }
    } while (row != null)
    rows.toList
  }
}
