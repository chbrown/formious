(ns com.formious.commmon
  (:require [ring.util.response :refer [response status]]
            [clojure.set :as set]
            [clojure.string :as string]))

(defn no-content
  ([] (no-content (response "")))
  ([resp] (status resp 204)))

(defn created
  [resp]
  (status resp 201))

(defn update-when
  "Like update but only calls f if m contains k"
  [m k f & args]
  (if (contains? m k) (apply update m k f args) m))
