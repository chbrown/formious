(ns formious.handlers.admin
  (:require [formious.views.common :refer [render-static-markup-with-doctype render-html-with-doctype admin-layout]]
            [formious.resources :refer [run-raw]]
            [ring.util.response :refer [response content-type]]))

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
        (response)
        (content-type "text/html"))))
