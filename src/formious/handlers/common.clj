(ns formious.handlers.common
  (:require [rum.core :as rum]
            [ring.util.mime-type :refer [ext-mime-type]]
            [ring.util.response :as response :refer [response]]))

(defn content-type-if-known
  "Add a Content-Type header to response if a mime type can be inferred from path"
  [response path]
  (if-let [mime-type (ext-mime-type path)]
    (response/content-type response mime-type)
    response))

(defn render-static-markup-with-doctype
  "Render static (not marked with React ids & checksums) HTML, complete with DOCTYPE header"
  [component]
  (str "<!DOCTYPE html>" (rum/render-static-markup component)))

(defn render-html-with-doctype
  "Render React-readable HTML, complete with DOCTYPE header"
  [component]
  (str "<!DOCTYPE html>" (rum/render-html component)))
