(ns formious.handlers.admin
  (:require [formious.handlers.common :refer [render-static-markup-with-doctype render-html-with-doctype html-response]]
            [formious.views.common :refer [admin-layout]]
            [formious.resources :refer [run-raw]]))

; ::routes/layout root/generate-layout
; (defn generate-layout
;   [request]
;   (-> (render-static-markup-with-doctype (admin-layout))
;       (response)
;       (response/content-type "text/html")))

(defn run
  [request component-fn resource-maps]
  (let [resources (map #(run-raw request %) resource-maps)]
    (-> (apply component-fn resources)
        (render-html-with-doctype)
        (html-response))))
