(ns com.formious.db
  (:require [clojure.java.jdbc :as jdbc])
  (:import [java.time Instant]
           [java.time.temporal ChronoUnit]
           [java.sql Timestamp]))

(def config "jdbc:postgresql:formious")

(def query (partial jdbc/query config))

(def insert! (partial jdbc/insert! config))

(def update! (partial jdbc/update! config))

(def delete! (partial jdbc/delete! config))
