(ns formious.server.table
  (:require [clojure.set :as set]
            [clojure.java.io :as io]
            [clojure.data.json :as json]
            [ring.util.request :as request])
  (:import (java.io Reader InputStream)
           (org.supercsv.io CsvMapReader)
           (org.supercsv.prefs CsvPreference)
           (org.apache.poi.ss.usermodel Cell)
           (org.apache.poi.xssf.usermodel XSSFSheet XSSFWorkbook)))

(defn csv-as-maps
  [^Reader reader]
  (let [mapReader (CsvMapReader. reader CsvPreference/STANDARD_PREFERENCE)
        ; header is used as varargs later, so it has to be an array
        header (into-array (.getHeader mapReader false))]
    (take-while some? (repeatedly #(.read mapReader header)))))

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

(defn parse-table
  "Parse tabular input flexibly and write out json to response"
  ; Header("Content-Type", "application/json"))
  [request]
  (case (request/content-type request)
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" (-> request :body first-sheet-as-maps)
    "application/json" (-> request :body (json/read-str :key-fn keyword) seq)
    ; default: csv
    (-> request :body io/reader csv-as-maps)))
