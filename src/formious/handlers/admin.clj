(ns formious.handlers.admin
  (:require [clojure.string :as str]
            [rum.core :as rum]
            [formious.views.common :refer [render-html-with-doctype admin-layout]]
            [formious.views.templates :as templates-views]
            [formious.resources :refer [run run-raw template]]
            [liberator.core :refer [run-resource]]
            [ring.util.response :refer [not-found redirect response content-type status]]))

; (def admin-layout-html (render-page (admin-layout)))

; ::routes/layout root/generate-layout
; (defn generate-layout
;   [request]
;   (-> (response admin-layout-html)
;       (response/content-type "text/html")))

(defn render-admin-template
  [request]
  (-> (run-raw request template)
      (templates-views/template)
      (render-html-with-doctype)
      (response)
      (content-type "text/html")))
