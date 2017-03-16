(ns formious.csv
  (:require [clojure.set :as set])
  (:import [java.io Reader]
           [org.supercsv.io CsvMapReader]
           [org.supercsv.prefs CsvPreference]))

(defn as-maps
  [^Reader reader]
  (let [mapReader (CsvMapReader. reader CsvPreference/STANDARD_PREFERENCE)
        ; header is used as varargs later, so it has to be an array
        header (into-array (.getHeader mapReader false))]
    (take-while some? (repeatedly #(.read mapReader header)))))
