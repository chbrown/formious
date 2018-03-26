(ns formious.views.responses
  (:require [rum.core :as rum]
            [formious.util :refer [unique-keys]]
            [formious.views.common :refer [datetime]]
            [formious.routes :refer [generate-path]]))

(defn- responses-table
  [responses]
  (let [context-keys (unique-keys (map :context responses))
        value-keys (unique-keys (map :value responses))]
    [:table {:class "fill padded striped lined"}
     [:thead
      [:tr
       [:th "Response ID"]
       [:th "Block ID"]
       [:th "Experiment ID"]
       [:th "Participant ID"]
       [:th "AWS Worker ID"]
       (for [key context-keys]
         [:th.context "context." key])
       (for [key value-keys]
         [:th.value "value." key])
       [:th "Created"]]]
     [:tbody
      (for [{:keys [id block_id experiment_id participant_id aws_worker_id context value created]} responses]
        [:tr
         [:td id]
         [:td block_id]
         [:td experiment_id]
         [:td participant_id]
         [:td aws_worker_id]
         (for [key context-keys]
           [:td.context
            (:key context)])
         (for [key value-keys]
           [:td.value
            (:key value)])
         [:td
          (datetime created :date)]])]]))

; $scope.$watch('$storage.responses_query', _.debounce($scope.refresh, 500), true)
(defn refresh
  [experiment_id template_id order_column order_direction limit]
  (let [params {:experiment_id experiment_id
                :template_id template_id
                :order_column order_column
                :order_direction order_direction
                :limit limit}]
    (println "TODO: actually refresh with params:" params)))

(rum/defcs responses < (rum/local {:experiment_id   0
                                   :template_id     0
                                   :order_column    "created"
                                   :order_direction "DESC"
                                   :limit           250} ::query-params)
  [state responses templates experiments]
  ; templates = Template.query()
  ; experiments = Experiment.query()
  (let [total-response-count (if (empty? responses) 0 (or (:count (first responses)) "N/A"))
        *query-params (::query-params state)
        {:keys [experiment_id template_id order_column order_direction limit]} @*query-params]
    [:div
     [:section.hpad [:h3 "Responses"]]
     [:section.hpad.box
      [:form {:on-submit #(refresh experiment_id template_id order_column order_direction limit)}
       [:div.controls
        [:label.control
         [:div [:b "Template"]]
         [:select {:value template_id}
          [:option {:value 0} "-- all --"]
          (for [{:keys [id name]} templates]
            [:option {:value id} name])]]
        [:label.control
         [:div [:b "Experiment"]]
         [:select {:value experiment_id}
          [:option {:value 0} "-- all --"]
          (for [{:keys [id name]} experiments]
            [:option {:value id} name])]]
        [:div.control
         [:div [:b "Order"]]
         [:select {:value order_column}
          [:option {:value "experiment_id"} "experiment_id"]
          [:option {:value "template_id"} "template_id"]
          [:option {:value "view_order"} "view_order"]
          [:option {:value "created"} "created"]]
         [:select {:value order_direction}
          [:option {:value "ASC" :title "smallest first"} "ASC"]
          [:option {:value "DESC" :title "largest first"} "DESC"]]]
        [:div.control
         [:div [:b "Limit"]]
         [:input {:value limit
                  :type "number"}]]]]]
     [:section.hpad
      [:p "Showing " (count responses) " out of " total-response-count " responses"]]
     [:section.box (responses-table responses)]]))
