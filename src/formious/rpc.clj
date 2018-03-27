(ns formious.rpc
  "Platform-dependent (dispatch! action) handlers, for Clojure."
  (:require [clojure.tools.logging :as log]
            [formious.db :as db]
            [formious.resources :as resources]
            [formious.resources.sql :as sql]
            [honeysql.core :as honeysql]
            [formious.store :refer [app-state dispatch!]]
            [formious.util :refer [keyed]]))

(defmethod dispatch! :select
  [{:keys [resource where-params]}]
  (let [rows (-> (sql/select resource where-params) honeysql/format db/query)]
    (swap! app-state update resource merge (keyed :id rows))))

(defmethod dispatch! :login!
  [{:keys [email password]}]
  (throw (ex-info (str `dispatch! `:login! ": not implemented on JVM") {:email email})))
