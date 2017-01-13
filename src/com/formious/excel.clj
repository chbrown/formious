(ns com.formious.excel
  (:require [clojure.set :as set])
  (:import [java.io InputStream]
           [org.apache.poi.ss.usermodel Cell]
           [org.apache.poi.xssf.usermodel XSSFSheet XSSFWorkbook]))

(defn- cell-string
  [^Cell cell]
  (case (.getCellType cell)
    Cell/CELL_TYPE_NUMERIC (.. cell getNumericCellValue toString)
    Cell/CELL_TYPE_STRING (.. cell getStringCellValue)
    Cell/CELL_TYPE_FORMULA (.. cell getStringCellValue) ;cell.getCellFormula
    Cell/CELL_TYPE_BLANK ""
    Cell/CELL_TYPE_BOOLEAN (.. cell getBooleanCellValue toString)
    Cell/CELL_TYPE_ERROR (.. cell getErrorCellValue toString)))

;val comment = sheet.getCellComment(row.getRowNum, index).getString

(defn- row->map
  [row]
  (into {} (for [cell row] {(.getColumnIndex cell) (cell-string cell)})))

(defn sheet-as-maps
  [^XSSFSheet sheet]
  (let [rows (.iterator sheet)
        headers (->> rows next row->map)]
    ; TODO: handle default, like: .withDefault(index => s"column_${index + 1}")
    (map #(-> % row->map (set/rename-keys headers)) rows)))

(defn first-sheet-as-maps
  [^InputStream inputStream]
  (let [workbook (XSSFWorkbook. inputStream)
        ;val numberOfSheets = workbook.getNumberOfSheets
        firstSheet (.getSheetAt workbook 0)]
    (sheet-as-maps firstSheet)))
