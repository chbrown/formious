(ns formious.excel
  (:require [clojure.set :as set])
  (:import (java.io InputStream)
           (org.apache.poi.ss.usermodel Cell)
           (org.apache.poi.xssf.usermodel XSSFSheet XSSFWorkbook)))

(defn- cell-string
  [^Cell cell]
  (case (.getCellType cell)
    Cell/CELL_TYPE_NUMERIC (.. cell getNumericCellValue) ; → double
    Cell/CELL_TYPE_STRING  (.. cell getStringCellValue toString)
    Cell/CELL_TYPE_FORMULA (.. cell getStringCellValue) ; (.. cell getCellFormula)
    Cell/CELL_TYPE_BLANK   ""
    Cell/CELL_TYPE_BOOLEAN (.. cell getBooleanCellValue) ; → boolean
    Cell/CELL_TYPE_ERROR   (.. cell getErrorCellValue))) ; → byte

(defn- row->map
  [row]
  (into {} (for [^Cell cell row] {(.getColumnIndex cell) (cell-string cell)})))

(defn sheet-as-maps
  [^XSSFSheet sheet]
  ; get-comment (fn [row-num index] (.getCellComment sheet row-num index)) ; row-num (.getRowNum row)
  (let [row-maps (->> (.iterator sheet) iterator-seq (map row->map))
        headers (first row-maps)]
    ; TODO: handle default, like: .withDefault(index => s"column_${index + 1}")
    (->> (rest row-maps)
         (map #(set/rename-keys (row->map %) headers)))))

(defn first-sheet-as-maps
  [^InputStream inputStream]
  ; (log/debug "selecting sheet 0 of " (.getNumberOfSheets (XSSFWorkbook. inputStream)))
  (-> (XSSFWorkbook. inputStream)
      (.getSheetAt 0)
      (sheet-as-maps)))
