(ns formious.views.common
  (:require [clojure.string :as str]
            [rum.core :as rum]))

(defn render-page
  "Render static (not marked with React ids & checksums) HTML, complete with DOCTYPE header"
  [component]
  (str "<!DOCTYPE html>" (rum/render-static-markup component)))

(rum/defc admin-layout
  []
  [:html
   [:head
    [:meta {:charset "UTF-8"}]
    [:title "Formious Admin"]
    [:link {:href "/favicon.png" :rel "icon" :type "image/png"}]
    [:link {:href "/build/site.css" :rel "stylesheet" :type "text/css"}]]
   [:body.admin
    [:div {:id "app"}]
    [:script {:src "/build/bundle.js"}]]])

(def admin-layout-html (render-page (admin-layout)))

(rum/defc block-layout
  [context-json-str header html]
  [:html
   [:head
    [:meta {:charset "UTF-8"}]
    [:title "title>Experimental Interface"]
    [:link {:href "data:;base64,=" :rel "icon" :type "image/x-icon"}]
    [:script {:src "//cdnjs.cloudflare.com/ajax/libs/jquery/1.12.4/jquery.min.js"}]
    [:script {:src "/public/formious-globals.js"}]
    [:script {:dangerouslySetInnerHTML {:__html (str "formious.context = " context-json-str ";")}}]]
   [:body
    {:dangerouslySetInnerHTML {:__html (str header \newline html)}}]])
