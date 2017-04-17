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
  [request component-fns resource-maps]
  (let [resources (map #(run-raw request %) resource-maps)]
    (-> (reduce (fn [args component-fn] (apply component-fn args)) resources (reverse component-fns))
        (render-html-with-doctype)
        (response)
        (content-type "text/html"))))
