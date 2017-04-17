(ns formious.views.access-tokens
  (:require [rum.core :as rum]
            [formious.views.common :refer [css-classes datetime table]]
            [formious.common :refer [path-for ->iso]]))

(defn- delete
  [id]
  (println "TODO: actually delete access_token #" id))

(defn- layout
  [children]
  [:div
   [:nav.fixedflow.sub
    [:a.tab {:href (path-for :admin-access-tokens)} "List access tokens"]
    [:a.tab {:href (path-for :admin-access-token :id "new")} "New access token"]]
   children])

(defn- edit
  [access_token]
  [:form.hpad {:ng-submit "sync($event)"}
   [:label.block
    [:div [:b "Token"]]
    [:input {:type "text"
             :default-value (:token access_token)
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Relation"]]
    [:input {:type "text"
             :default-value (:relation access_token)
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Foreign ID"]]
    [:input {:type "text"
             :default-value (:foreign_id access_token)
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

(def columns ["ID" "Token" "Relation / Foreign ID" "Expires" "Redacted" "Created" ""])

(defn cells
  [{:keys [id token relation foreign_id expires redacted created]}]
  [[:a {:href (path-for :admin-access-token :id id)} id]
   token
   [:a {:href (str "/admin/" relation "/" foreign_id)} (str relation "/" foreign_id)]
   (datetime expires :date)
   (datetime redacted :date)
   (datetime created :date)
   [:button {:on-click (fn [_] (delete id))} "Delete"]])

(rum/defc access-tokens
  [access_tokens]
  (layout
   [:div
    [:section.hpad [:h3 "Access Tokens"]]
    [:section.box (table access_tokens columns cells (:default-table css-classes))]]))

(rum/defc access-token
  [access_token]
  (layout (edit access_token)))
