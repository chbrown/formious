(ns formious.admin.pages.responses
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
   [:section {:className "hpad"} [:h3 "Responses"]]
   [:section {:className "box hpad"}
    [:form {:ng-submit "refresh()"}
     [:div {:className "controls"}
      [:label {:className "control"}
       [:div [:b "Template"]]
       [:select {:ng-model "$storage.responses_query.template_id"
                 :ng-options "template.id as template.name for template in templates"}
        [:option {:value true} "-- all --"]]]
      [:label {:className "control"}
       [:div [:b "Experiment"]]
       [:select {:ng-model "$storage.responses_query.experiment_id"
                 :ng-options "experiment.id as experiment.name for experiment in experiments"}
        [:option {:value true} "-- all --"]]]
      [:div {:className "control"}
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
      [:div {:className "control"}
       [:div [:b "Limit"]]
       [:input {:ng-model "$storage.responses_query.limit"
                :type "number"}]]]]]
   [:section {:className "hpad"}
    [:p
     "Showing "
     (:length responses)
     " out of "
     (if (=== (:length responses) 0) 0 (if (:count (first responses)) (:count (first responses)) "N/A"))
     " responses"]]
   [:section {:className "box"}
    [:table {:className "striped grid padded fill"}
     [:thead
      [:tr
       [:th "Response ID"]
       [:th "Block ID"]
       [:th "Experiment ID"]
       [:th "Participant ID"]
       [:th "AWS Worker ID"]
       (for [key context_keys]
         [:th {:className "context"}
          "context." key])
       (for [key value_keys]
         [:th {:className "value"}
          "value." key])
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
           [:td {:className "context"}
            (:key (:context response))])
         (for [key value_keys]
           [:td {:className "value"}
            (:key (:value response))])
         [:td
          [:DateTime {:date (:created response)}]]])]]]])
