(ns com.formious.common
  (:require [ring.util.response :refer [response status]]
            [clojure.set :as set]
            [clojure.string :as string]))

(defn no-content
  ([] (no-content ""))
  ([body] (status (response body) 204)))

(defn created
  [body]
  (status (response body) 201))

(defn ok
  [body]
  (response body))

(defn update-when
  "Like update but only calls f if m contains k"
  [m k f & args]
  (if (contains? m k) (apply update m k f args) m))
