(ns formious.views.participants
  (:require [rum.core :as rum]
            [formious.views.common :refer [css-classes datetime table table-container]]))

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
     [:tbody
      (for [{:keys [submitted blocklist others created seen responses
                    bonus_paid bonus_owed password superuser tokens]} participants]
        [:tr
         [:td (datetime submitted)]
         [:td blocklist]
         [:td {:style {:max-width "600px"}}
          [:div.hover-flow
           (str others)]] ; (json/write-str others)]]
         [:tr [:td "Created"] [:td created]]
         [:tr [:td "Seen"] [:td seen]]
         [:tr [:td "Number of Responses"] [:td (:length responses)]]
         [:tr [:td "Bonus paid"] [:td bonus_paid]]
         [:tr [:td "Bonus owed"] [:td bonus_owed]]
         [:tr [:td "Password"] [:td password]]
         [:tr [:td "Superuser"] [:td superuser]]
         [:tr [:td "Tokens"] [:td [:div (:each tokens)]]]])]]]])
