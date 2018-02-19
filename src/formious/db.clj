(ns formious.db
  (:require [clojure.tools.logging :as log]
            [clojure.java.jdbc :as jdbc]
            [clojure.data.json :as json]
            [era.core :refer [->ZonedDateTime]]
            [formious.util :refer [keyed]]
            [formious.resources :as resources]
            [honeysql.core :as sql]
            [honeysql.helpers :refer [merge-where]]))

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

;; data-driven (ORM-ish) querying

(def select-cols
  "This is used by query, below, and lets us exclude specific columns from
  certain sensitive resources types."
  {::resources/administrator [:id :email :created]})

(defn query-resource
  "Mapping from a resource keyword & corresponding params to the matching data
  in the database, as a sequence of maps."
  [resource-kw params]
  (let [select-map {:select (get select-cols resource-kw [:*])
                    :from [(keyword (name resource-kw))]
                    :order-by [:id]}
        sql-map (reduce merge-where select-map (for [[k v] params] [:= k v]))]
    (log/info "query:sql" (pr-str (sql/format sql-map)))
    (query (sql/format sql-map))))

(defn update-store
  [store [resource-kw params]]
  (let [resource-data (query-resource resource-kw params)
        store-map (keyed :id resource-data)]
    (update store resource-kw merge store-map)))

(defn load-store
  [resources]
  (reduce update-store {} resources))
