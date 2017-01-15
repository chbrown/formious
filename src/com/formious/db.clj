(ns com.formious.db
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.data.json :as json])
  (:import [java.time Instant ZoneId ZonedDateTime]
           [java.sql Timestamp]
           [org.postgresql.util PGobject]))

(defn ->ZonedDateTime
  [^Timestamp timestamp]
  (let [millis (.getTime timestamp)
        ; TODO: use timestamp.getNanos for higher precision
        instant (Instant/ofEpochMilli millis)
        ; TODO: verify that this timezone handling is correct
        zone (ZoneId/systemDefault)]
    (ZonedDateTime/ofInstant instant zone)))

(extend-protocol jdbc/IResultSetReadColumn
  Timestamp
  (result-set-read-column [val _2 _3] (->ZonedDateTime val))
  PGobject
  (result-set-read-column [val _2 _3] ; val rsmeta idx
    ; (println "parsing:PGobject" val rsmeta idx)
    (case (.getType val)
      "jsonb" (json/read-str (.getValue val))
      "json" (json/read-str (.getValue val)))))

(def config "jdbc:postgresql:formious")

(def query (partial jdbc/query config))

(def insert! (partial jdbc/insert! config))

(def update! (partial jdbc/update! config))

(def delete! (partial jdbc/delete! config))
