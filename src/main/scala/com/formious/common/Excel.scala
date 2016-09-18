package com.formious.common

import java.io.InputStream

import org.apache.poi.ss.usermodel.Cell
import org.apache.poi.xssf.usermodel.{XSSFSheet, XSSFWorkbook}

import scala.collection.JavaConversions._

object Excel {
  private def cellString(cell: Cell): String = {
    cell.getCellType match {
      case Cell.CELL_TYPE_NUMERIC =>
        cell.getNumericCellValue.toString
      case Cell.CELL_TYPE_STRING =>
        cell.getStringCellValue
      case Cell.CELL_TYPE_FORMULA =>
        //cell.getCellFormula
        cell.getStringCellValue
      case Cell.CELL_TYPE_BOOLEAN =>
        cell.getBooleanCellValue.toString
      case Cell.CELL_TYPE_ERROR =>
        cell.getErrorCellValue.toString
    }
  }

  private def cellTuple(cell: Cell) = cell.getColumnIndex -> cellString(cell)

  def sheetToMaps(sheet: XSSFSheet) = {
    Console.err.println(s"Parsing XLSX sheet '${sheet.getSheetName}'")
    val rowIterator = sheet.iterator
    // TODO: figure out if there's a way to pattern-match on Iterator?
    val columnHeaders = rowIterator.next.map(cellTuple).toMap.withDefault(index => s"column_${index + 1}")
    rowIterator.map { row =>
      row.map(cellTuple).map { case (index, value) =>
        //val comment = sheet.getCellComment(row.getRowNum, index).getString
        columnHeaders(index) -> value
      }.toMap
    }.toList
  }

  def streamFirstSheetToMaps(inputStream: InputStream) = {
    val workbook = new XSSFWorkbook(inputStream)
    //val numberOfSheets = workbook.getNumberOfSheets
    val firstSheet = workbook.getSheetAt(0)
    sheetToMaps(firstSheet)
  }
}
