(ns formious.views.accesstokens
  (:require [rum.core :as rum]
            [formious.views.common :refer [Link datetime table-container]]
            [formious.resources :as resources]
            [formious.routes :refer [generate-path]]))

(defn- delete
  [id]
  (println "TODO: actually delete accesstoken #" id))

(defn- layout
  [children]
  [:div
   [:nav.fixedflow.sub
    [:a.tab {:href (generate-path {:endpoint ::resources/accesstoken})} "List access tokens"]
    [:a.tab {:href (generate-path {:endpoint ::resources/accesstoken :id "new"})} "New access token"]]
   children])

(defn- edit
  [{:keys [id token relation foreign_id expires redacted created]}]
  [:form.hpad {:ng-submit "sync($event)"}
   [:label.block
    [:div [:b "Token"]]
    [:input {:type "text"
             :default-value token
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Relation"]]
    [:input {:type "text"
             :default-value relation
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Foreign ID"]]
    [:input {:type "text"
             :default-value foreign_id
             :style {:width "100%"}}]]
   [:label.block
    [:div [:b "Expires"]]
    (datetime expires)]
   [:label.block
    [:div [:b "Redacted"]]
    (datetime redacted)]
   [:label.block
    [:div [:b "Created"]]
    (datetime created)]
   [:div.block [:button "Save"]]])

(defn- accesstoken->cells
  [{:keys [id token relation foreign_id expires redacted created]}]
  [[:a {:href (generate-path {:endpoint ::resources/accesstoken :id id})} id]
   token
   [:a {:href (str "/admin/" relation "/" foreign_id)} (str relation "/" foreign_id)]
   (datetime expires :date)
   (datetime redacted :date)
   (datetime created :date)
   [:button {:on-click (fn [_] (delete id))} "Delete"]])

(rum/defc accesstokens
  [accesstokens]
  (layout
   (table-container
    "Access Tokens"
    ["ID" "Token" "Relation / Foreign ID" "Expires" "Redacted" "Created" ""]
    (map accesstoken->cells accesstokens))))

(rum/defc accesstokens-reactive < rum/reactive
  [accesstokens-atom]
  (accesstokens (rum/react accesstokens-atom)))

(rum/defc accesstoken
  [accesstoken]
  (layout (edit accesstoken)))
