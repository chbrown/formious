(ns formious.db.common
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json])
  (:import (java.sql Timestamp)
           (java.time Instant ZoneId ZonedDateTime)
           (org.postgresql.util PGobject)))

(def now #(ZonedDateTime/now))

(defn ZonedDateTime->String
  ; ZonedDateTime's toString looks like "2016-07-04T13:41:28.365-05:00[America/Chicago]"
  ; (.. zdt toOffsetDateTime toString) would probably work just as well
  [^ZonedDateTime zdt]
  (.. zdt toInstant toString))

(defn ZonedDateTime->Timestamp
  [^ZonedDateTime zdt]
  (Timestamp/from (.toInstant zdt)))

(defn Instant->ZonedDateTime
  [^Instant instant]
  ; TODO: verify that this timezone handling is correct
  (ZonedDateTime/ofInstant instant (ZoneId/systemDefault)))

(defn Timestamp->ZonedDateTime
  [^Timestamp timestamp]
  ; TODO: use timestamp.getNanos for higher precision
  (-> (.getTime timestamp) Instant/ofEpochMilli Instant->ZonedDateTime))

(defn String->ZonedDateTime
  [s]
  (Instant->ZonedDateTime (Instant/parse s)))

(defn ->long
  "Convert to Long, parsing if needed"
  [value]
  (condp instance? value
    Long value
    Integer (long value)
    (Long/parseLong value)))

(extend-protocol jdbc/IResultSetReadColumn
  Timestamp
  (result-set-read-column [val _2 _3] (Timestamp->ZonedDateTime val))
  PGobject
  (result-set-read-column [val rsmeta idx]
    (log/trace "parsing:PGobject" val rsmeta idx)
    (case (.getType val)
      "jsonb" (json/read-str (.getValue val))
      "json" (json/read-str (.getValue val)))))

(def config "jdbc:postgresql:formious")

(def query (partial jdbc/query config))

(def insert! (partial jdbc/insert! config))

(def update! (partial jdbc/update! config))

(def delete! (partial jdbc/delete! config))
