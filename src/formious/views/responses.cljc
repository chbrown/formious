(ns formious.views.responses
  (:require [rum.core :as rum]))

; .controller('admin.responses.table', ($scope, $timeout, $localStorage, Response, Template, Experiment) => {
;   $scope.$storage = $localStorage.$default({
;     responses_query: {
;       order_column: 'created',
;       order_direction: 'DESC',
;       limit: 250,
;     }
;   });
;   $scope.templates = Template.query();
;   $scope.experiments = Experiment.query();
;   $scope.value_keys = [];
;   $scope.refresh = () => {
;     var params = {
;       experiment_id: $scope.$storage.responses_query.experiment_id,
;       template_id: $scope.$storage.responses_query.template_id,
;       order_column: $scope.$storage.responses_query.order_column,
;       order_direction: $scope.$storage.responses_query.order_direction,
;       limit: $scope.$storage.responses_query.limit,
;     };
;     $scope.responses = Response.query(params, function() {
;       $scope.context_keys = _.chain($scope.responses)
;         .pluck('context').map(_.keys).flatten().uniq().without('$$hashKey').value();
;       $scope.value_keys = _.chain($scope.responses)
;         .pluck('value').map(_.keys).flatten().uniq().without('$$hashKey').value();
;     });
;   };
;   $scope.$watch('$storage.responses_query', _.debounce($scope.refresh, 500), true);
; });

(rum/defc ResponsesTable
  [responses context_keys value_keys]
  [:div
   [:section.hpad [:h3 "Responses"]]
   [:section.hpad.box
    [:form {:ng-submit "refresh()"}
     [:div {:class "controls"}
      [:label {:class "control"}
       [:div [:b "Template"]]
       [:select {:ng-model "$storage.responses_query.template_id"
                 :ng-options "template.id as template.name for template in templates"}
        [:option {:value true} "-- all --"]]]
      [:label {:class "control"}
       [:div [:b "Experiment"]]
       [:select {:ng-model "$storage.responses_query.experiment_id"
                 :ng-options "experiment.id as experiment.name for experiment in experiments"}
        [:option {:value true} "-- all --"]]]
      [:div {:class "control"}
       [:div [:b "Order"]]
       [:select {:ng-model "$storage.responses_query.order_column"}
        [:option {:value "experiment_id"} "experiment_id"]
        [:option {:value "template_id"} "template_id"]
        [:option {:value "view_order"} "view_order"]
        [:option {:value "created"} "created"]]
       [:select {:ng-model "$storage.responses_query.order_direction"}
        [:option {:value "ASC"
                  :title "smallest first"} "ASC"]
        [:option {:value "DESC"
                  :title "largest first"} "DESC"]]]
      [:div {:class "control"}
       [:div [:b "Limit"]]
       [:input {:ng-model "$storage.responses_query.limit"
                :type "number"}]]]]]
   [:section.hpad
    [:p
     "Showing " (:length responses)
     " out of " (if (empty? responses) 0 (or (:count (first responses)) "N/A")) " responses"]]
   [:section.box
    [:table.fill.padded.striped.grid
     [:thead
      [:tr
       [:th "Response ID"]
       [:th "Block ID"]
       [:th "Experiment ID"]
       [:th "Participant ID"]
       [:th "AWS Worker ID"]
       (for [key context_keys]
         [:th.context "context." key])
       (for [key value_keys]
         [:th.value "value." key])
       [:th "Created"]]]
     [:tbody
      (for [response responses]
        [:tr
         [:td (:id response)]
         [:td (:block_id response)]
         [:td (:experiment_id response)]
         [:td (:participant_id response)]
         [:td (:aws_worker_id response)]
         (for [key context_keys]
           [:td.context
            (:key (:context response))])
         (for [key value_keys]
           [:td.value
            (:key (:value response))])
         [:td
          [:DateTime {:date (:created response)}]]])]]]])
