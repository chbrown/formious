(ns formious.resources.info
  (:require [formious.db.block :as Block]
            [clojure.java.io :as io]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [multi-defaults single-defaults]]))

(defn- resource->Properties
  "Load the given resource as a Properties instance"
  [resource-name]
  (with-open [reader (-> resource-name io/resource io/reader)]
    (doto (java.util.Properties.)
          (.load reader))))

(defresource info
  :available-media-types ["application/json"]
  :allowed-methods [:get]
  ; Load and return a hash-map representation of the project's POM properties
  :handle-ok (fn [ctx]
               (->> (resource->Properties "META-INF/maven/formious/app/pom.properties")
                    (into {}))))
