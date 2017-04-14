(ns formious.handlers.admin
  (:require [clojure.string :as str]
            [rum.core :as rum]
            [formious.views.common :refer [render-html-with-doctype admin-layout]]
            [formious.views.templates :as templates-views]
            [formious.resources.templates :as templates-resources]
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
  (let [template (run-resource request (assoc templates-resources/template-options :as-response (fn [d ctx] d)))]
    (println "Got template from resource:" (type template) template)
    (-> (templates-views/template template)
        (render-html-with-doctype)
        (response)
        (content-type "text/html"))))
