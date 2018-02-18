(ns formious.client.api
  (:require [clojure.string :as str]
            [cljs.core.async :refer [<! go]]
            [cljs-http.client :as http]
            [formious.util :refer [keyed elide]]
            [formious.store :refer [app-state]]
            [formious.routes :as routes :refer [generate-path]]))

(defn fetch-resource!
  "Given a resource specification (resource keyword and potentially params)
  E.g. (fetch-resource ::resources/accesstoken {:id 123})"
  [endpoint route-params]
  (let [api-url (generate-path (assoc route-params :group :api :endpoint endpoint))]
    (println "fetch-resource! using url" api-url)
    (go (let [{:keys [body]} (<! (http/get api-url))
              ; body might be a seq, or it might be a single map - so we ensure it's a seq
              body-resources (if (sequential? body) body (list body))]
          (println "fetch-resource! got body-resources" (elide (str body-resources) 200))
          (swap! app-state update endpoint merge (keyed :id body-resources))))))
