(ns user
  (:require [clojure.pprint :refer [pp pprint print-table]]
            [bidi.bidi :as bidi]
            [formious.common :as common]
            [formious.routes :as routes]
            [formious.server.mturk :as mturk]
            [clojure.tools.namespace.repl :refer [refresh refresh-all]]))

(println "⭐ Loading /dev/user⭐")

(defn print-routes
  "Print out the handler keywords for all the app's routes"
  []
  (->> (bidi/route-seq routes/routes)
       (map :handler)
       (set)
       (sort)
       (map println)
       (dorun)))

(def aws-credentials {:access_key_id (System/getenv "AWS_ACCESS_KEY_ID")
                      :secret_access_key (System/getenv "AWS_SECRET_ACCESS_KEY")})
