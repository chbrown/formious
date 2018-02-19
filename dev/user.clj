(ns user
  (:require [clojure.repl :refer :all]
            [clojure.pprint :as pprint :refer [pp pprint]]
            [clojure.string :as str]
            [clojure.java.io :as io]
            [rum.core :as rum]
            [fancy.table :refer [print-table]]
            [era.core :as era]
            [routes.extra] ; make sure PatternListing implementation gets loaded properly
            [routes.tools :refer [listing]]
            [formious.util]
            [formious.resources :as resources]
            [formious.routes :as routes :refer [resolve-endpoint generate-path]]
            [formious.server :as server]
            [formious.server.mturk :as mturk]
            [formious.db :as db]
            [honeysql.core :as sql]
            [honeysql.helpers :as sql-helpers]
            [cognitect.transit :as transit]
            [clojure.tools.namespace.repl :refer [refresh refresh-all]]))

(println "⭐ Loading /dev/user⭐")

(def aws-credentials
  {:access_key_id     (System/getenv "AWS_ACCESS_KEY_ID")
   :secret_access_key (System/getenv "AWS_SECRET_ACCESS_KEY")})

(defn print-routes
  "Print out the route descriptions for all the app's routes"
  []
  (->> (listing routes/routes)
       (map #(update % :path str/join))
       (print-table [:path :keys :endpoint])))

(defn print-route-endpoints
  "Print out the endpoints (keywords) for all the app's routes"
  []
  (->> (listing routes/routes)
       (map :endpoint)
       (distinct)
       (sort)
       (run! println)))
