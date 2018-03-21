(ns formious.db
  (:require [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [clojure.data.json :as json]
            [era.core :refer [->ZonedDateTime]]))

(def db-spec
  {:dbtype "postgresql"
   :dbname "formious"
   ; workaround for inserting strings and letting PostgreSQL coerce
   ; them to enums if needed -- see https://stackoverflow.com/a/21752697
   :stringtype "unspecified"})

(extend-protocol jdbc/IResultSetReadColumn
  java.sql.Timestamp
  (result-set-read-column [val rsmeta idx]
    (->ZonedDateTime val))

  org.postgresql.util.PGobject
  (result-set-read-column [val rsmeta idx]
    (log/trace "parsing:PGobject" val rsmeta idx)
    (case (.getType val)
      "jsonb" (json/read-str (.getValue val))
      "json" (json/read-str (.getValue val))
      (do
        (log/warn "Unable to parse PGobject with unrecognized type:" (.getType val))
        val))))

(extend-protocol jdbc/ISQLValue
  java.time.Instant
  (sql-value [val]
    (java.sql.Timestamp/from val))

  clojure.lang.ISeq
  (sql-value [val]
    (.createArrayOf (jdbc/get-connection db-spec) "text" (into-array val))))

;; SQL PreparedStatement-driven querying

(def query
  "jdbc/query preconfigured with the default connection"
  (partial jdbc/query db-spec))

(def insert!
  "jdbc/insert! preconfigured with the default connection"
  (partial jdbc/insert! db-spec))

(def update!
  "jdbc/update! preconfigured with the default connection"
  (partial jdbc/update! db-spec))

(def delete!
  "jdbc/delete! preconfigured with the default connection"
  (partial jdbc/delete! db-spec))

(def execute!
  "jdbc/execute! preconfigured with the default connection"
  (partial jdbc/execute! db-spec))
