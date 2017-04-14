(ns formious.resources.file
  (:require [ring.util.request :refer [path-info]]
            [ring.util.response :refer [not-found response resource-response content-type]]
            [liberator.core :refer [defresource]]
            [liberator.representation :refer [ring-response]]
            [formious.resources.rest :refer [multi-defaults single-defaults]]))

(defresource file
  :media-type-available? true
  :allowed-methods [:get :head]
  :initialize-context (fn [ctx]
                        {:path (path-info (:request ctx))})
  :exists? (fn [ctx]
             (when-let [resource (resource-response (:path ctx) {:root "public"})]
               {:resource resource}))
  :handle-ok (fn [ctx]
               (ring-response (:resource ctx))))

(defresource favicon
  :media-type-available? true
  :allowed-methods [:get]
  :exists? (fn [ctx]
             (when-let [resource (resource-response (:path ctx) {:root "public"})]
               {:resource resource}))
  :handle-ok (fn [ctx]
               (-> (resource-response "public/favicon.png")
                   (content-type "image/png")
                   (ring-response))))
