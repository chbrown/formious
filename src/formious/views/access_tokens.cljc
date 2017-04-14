(ns formious.views.access-tokens
  (:require [rum.core :as rum]
            [formious.common :refer [path-for ->iso]]))

(defn- delete
  [access_token]
  (println "TODO: actually delete access_token" access_token))

(rum/defc AccessTokensTable
  [access_tokens]
  [:div
   [:section.hpad [:h3 "Access Tokens"]]
   [:section.box
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
          [:a {:href (path-for :access_tokens :id (:id access_token))} (:id access_token)]]
         [:td (:token access_token)]
         [:td
          [:a {:href (str "/admin/" (:relation access_token) "/" (:foreign_id access_token) "")}
           (:relation access_token) "/" (:foreign_id access_token)]]
         [:td [:time (->iso (:expires access_token) :date)]]
         [:td [:time (->iso (:redacted access_token) :date)]]
         [:td [:time (->iso (:created access_token) :date)]]
         [:td [:button {:on-click (fn [_] (delete access_token))} "Delete"]]])]]]])

(rum/defc AccessTokensLayout
  [children]
  [:div
   [:nav.fixedflow.sub
    [:a.tab {:href (path-for :access_tokens)}
     "List access tokens"]
    [:a.tab {:href (path-for :access_token :id "new")}
     "New access token"]]
   children])

(rum/defc AccessTokensEdit
  [access_token]
  [:form.hpad {:ng-submit "sync($event)"}
   [:label.block
    [:div [:b "Token"]]
    [:input {:type "text"
             :defaultValue (:token access_token)
             :style "width: 100%"}]]
   [:label.block
    [:div [:b "Relation"]]
    [:input {:type "text"
             :defaultValue (:relation access_token)
             :style "width: 100%"}]]
   [:label.block
    [:div [:b "Foreign ID"]]
    [:input {:type "text"
             :defaultValue (:foreign_id access_token)
             :style "width: 100%"}]]
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
