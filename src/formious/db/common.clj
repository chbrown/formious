(ns formious.db.common
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.data.json :as json]
            [formious.common :refer [->ZonedDateTime]]))

(extend-protocol jdbc/IResultSetReadColumn
  java.sql.Timestamp
  (result-set-read-column [val _2 _3] (->ZonedDateTime val))
  org.postgresql.util.PGobject
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
