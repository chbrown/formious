(ns formious.views.access-tokens
  (:require [rum.core :as rum]
            [formious.common :refer [path-for ->iso]]))

(defn- delete
  [access_token]
  (println "TODO: actually delete access_token" access_token))

(defn- layout
  [children]
  [:div
   [:nav.fixedflow.sub
    [:a.tab {:href (path-for :admin-access-tokens)} "List access tokens"]
    [:a.tab {:href (path-for :admin-access-token :id "new")} "New access token"]]
   children])

(defn- table
  [access_tokens]
  [:table.striped.lined.padded.fill
   [:thead
    [:tr
     [:th "ID"]
     [:th "Token"]
     [:th "Relation / Foreign ID"]
     [:th "Expires"]
     [:th "Redacted"]
     [:th "Created"]
     [:th]]]
   [:tbody
    (for [access_token access_tokens]
      [:tr
       [:td {:title (:id access_token)}
        [:a {:href (path-for :admin-access-token :id (:id access_token))} (:id access_token)]]
       [:td (:token access_token)]
       [:td
        [:a {:href (str "/admin/" (:relation access_token) "/" (:foreign_id access_token) "")}
         (:relation access_token) "/" (:foreign_id access_token)]]
       [:td [:time (->iso (:expires access_token) :date)]]
       [:td [:time (->iso (:redacted access_token) :date)]]
       [:td [:time (->iso (:created access_token) :date)]]
       [:td [:button {:on-click (fn [_] (delete access_token))} "Delete"]]])]])

(defn- edit
  [access_token]
  [:form.hpad {:ng-submit "sync($event)"}
   [:label.block
    [:div [:b "Token"]]
    [:input {:type "text"
             :defaultValue (:token access_token)
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Relation"]]
    [:input {:type "text"
             :defaultValue (:relation access_token)
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Foreign ID"]]
    [:input {:type "text"
             :defaultValue (:foreign_id access_token)
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Expires"]]
    [:time (->iso (:expires access_token))]]
   [:label.block
    [:div [:b "Redacted"]]
    [:time (->iso (:redacted access_token))]]
   [:label.block
    [:div [:b "Created"]]
    [:time (->iso (:created access_token))]]
   [:div.block [:button "Save"]]])

(rum/defc access-tokens
  [access_tokens]
  (layout
   [:div
    [:section.hpad [:h3 "Access Tokens"]]
    [:section.box
     (table access_tokens)]]))

(rum/defc access-token
  [access_token]
  (layout (edit access_token)))
