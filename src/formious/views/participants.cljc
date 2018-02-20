(ns formious.views.participants
  (:require [rum.core :as rum]
            [formious.views.common :refer [datetime keyval-table table]]))

(defn- participant-row
  [{:keys [submitted blocklist created seen responses
           bonus_paid bonus_owed password superuser tokens]}]
  [:tr
   [:td (datetime submitted)]
   [:td blocklist]
   ; "other data" cell
   [:td {:style {:max-width "600px"}}
    [:div.hover-flow
     (keyval-table
      {"Created"             created
       "Seen"                seen
       "Number of Responses" (count responses)
       "Bonus paid"          bonus_paid
       "Bonus owed"          bonus_owed
       "Password"            password
       "Superuser"           superuser
       "Tokens"              tokens})]]])

(rum/defc ParticipantsEdit
  [participants]
  [:div
   [:label
    [:span "ID"]
    [:input {:name "_id"
             :type "text"
             :value "{_id}"
             :style {:width "250px"}}]]
   [:label
    [:span "Bonus paid"]
    [:input {:name "bonus_paid"
             :type "text"
             :value "{bonus_paid}"}]]
   [:label
    [:span "Bonus owed"]
    [:input {:name "bonus_owed"
             :type "text"
             :value "{bonus_owed}"}]]
   [:section
    [:h3 "Responses"]
    [:table
     [:thead
      [:tr
       [:th "Submitted"]
       [:th "Blocklist"]
       [:th]]]
     [:tbody (map participant-row participants)]]]])
