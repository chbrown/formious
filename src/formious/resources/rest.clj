(ns formious.resources.rest
  (:require [liberator.core :refer [run-resource]]))

(def defaults {:available-media-types ["application/json"]
               :initialize-context #(get-in % [:request :route-params])})
(def multi-defaults (assoc defaults :allowed-methods [:get :post]))
(def single-defaults (assoc defaults :allowed-methods [:get :put]))

(defmacro defresource
  "Simplified defresource:
  1. no support for the parameterized resource syntax
  2. name should be a symbol
  3. options should be a proper map"
  [name options]
  `(defn ~name
     [request#]
     (run-resource request# options)))

(defn resource-list
  [columns all insert!]
  {:available-media-types ["application/json"]
   :allowed-methods [:get :post]
   :handle-ok (fn [_] (all))
   ; :post-redirect? (fn [ctx] {:location ...})
   :post! #(-> % :request :body (select-keys columns) insert!)})

(defn resource-record
  [columns blank find-by-id update! delete!]
  {:available-media-types ["application/json"]
   :allowed-methods [:get :put]
   :initialize-context #(get-in % [:request :route-params])
   :exists? (fn [ctx]
              (when-let [record (if (= (:id ctx) "new") (blank) (find-by-id (:id ctx)))]
                {:record record}))
   :handle-ok :record
   :put! (fn [ctx]
           (let [body (-> ctx :request :body (select-keys columns))]
             (update! (:id ctx) body)))
   :delete! (fn [{:keys [:id]}]
              (delete! id))})
