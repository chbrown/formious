(ns formious.actions
  "This module provides helpers to create 'actions' that are subsequently to be `dispatch!`ed"
  (:require [formious.resources :refer [metadata resource-keyword?]]))

;; Resource-based actions

(defn select
  ([resource]
   {:pre [(resource-keyword? resource)]}
   {:type     :select
    :resource resource})
  ([resource where-params]
   {:pre [(map? where-params)]}
   (assoc (select resource) :where-params where-params)))

(defn insert!
  [resource value-params]
  {:pre [(resource-keyword? resource) (map? value-params)]}
  {:type         :insert!
   :resource     resource
   :value-params value-params})

(defn update!
  ; setting the writable columns of `params` (a map) where matched by the non-writable columns.
  ([resource params]
   {:pre [(resource-keyword? resource) (map? params)]}
   (let [writable-columns (get-in metadata [resource :writable-columns])
         set-params (select-keys params writable-columns)
         where-params (apply dissoc params :created writable-columns)]
     (update! resource set-params where-params)))
  ([resource set-params where-params]
   {:pre [(resource-keyword? resource) (map? set-params) (map? where-params)]}
   {:type         :update!
    :resource     resource
    :set-params   set-params
    :where-params where-params}))

(defn delete!
  [resource where-params]
  {:pre [(resource-keyword? resource) (map? where-params)]}
  {:type         :delete!
   :resource     resource
   :where-params where-params})

;; Other actions

(defn login!
  [email password]
  {:type     :login!
   :email    email
   :password password})

(defn logout!
  []
  {:type :logout!})
