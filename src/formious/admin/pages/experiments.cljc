(ns formious.admin.pages.experiments
  (:require [rum.core :as rum]))

(rum/defc ExperimentsLayout
  [children]
  [:div
   [:nav {:fixedflow true
          :className "sub"}
    [:a {:ui-sref "admin.experiments.table"
         :ui-sref-active "current"
         :className "tab"}
     "List experiments"]
    [:a {:ui-sref "admin.experiments.edit({experiment_id: 'new'})"
         :ui-sref-active "current"
         :className "tab"}
     "New experiment"]]
   children])

; .controller('admin.experiments.table', function($scope, $state, $location, Experiment, Administrator) {
;   $scope.experiments = Experiment.query();
;   $scope.administrators = Administrator.query();

;   $scope.delete = function(experiment) {
;     var promise = experiment.$delete().then(function() {
;       $scope.experiments.splice($scope.experiments.indexOf(experiment), 1);
;       return 'Deleted';
;     });
;     NotifyUI.addPromise(promise);
;   };
; })

(rum/defc ExperimentsTable
  [experiments]
  [:div
   [:section {:className "hpad"} [:h3 "Experiments"]]
   [:section {:className "box"}
    [:table {:className "striped lined padded fill"}
     [:thead [:tr [:th "Name"] [:th "Created"] [:th "Owner"] [:th] [:th] [:th]]]
     [:tbody
      (for [experiment experiments]
        [:tr
         [:td
          [:a {:ui-sref "admin.experiments.edit.blocks({experiment_id: experiment.id})"}
           (:name experiment)]]
         [:td [:DateTime {:date (:created experiment)}]]
         [:td
          [:a {:ui-sref "admin.administrators.edit({id: experiment.administrator_id})"}
           administrators
           "valueWhere:{id: experiment.administrator_id}:'email'"]]
         [:td
          [:a {:href "/experiments/{experiment.id}/responses?token={experiment.access_token}"
               :target "_blank"}
           "Responses"]
          "         ("
          (|| (:responses_count experiment) 0)
          ")       "]
         [:td {:className "nowrap"}
          [:a {:href "/experiments/{experiment.id}"
               :target "_blank"} "Public"]]
         [:td [:button {:ng-click "delete(experiment)"} "Delete"]]])]]]])

; .controller('admin.experiments.edit', function($scope, $state, $localStorage,
;     Experiment, Template, Administrator) {
;   $scope.$storage = $localStorage.$default({expand_experiment_html: false});

;   var experiment = $scope.experiment = Experiment.get({id: $state.params.experiment_id});
;   // $scope.aws_accounts = AWSAccount.query();
;   $scope.administrators = Administrator.query();
;   $scope.templates = Template.query();

;   $scope.syncExperiment = function() {
;     var promise = experiment.$save(function() {
;       $state.go('.', {experiment_id: experiment.id}, {notify: false});
;     }).then(function() {
;       return 'Saved experiment';
;     });
;     NotifyUI.addPromise(promise);
;   };

;   // the 'save' event is broadcast on rootScope when command+S is pressed
;   $scope.$on('save', $scope.syncExperiment);

;   // generate link to hit creation page
;   $scope.site_url = Url.parse(window.location).merge({path: '/'}).toString();
; });

(rum/defc ExperimentsEdit
  []
  [:div
   [:nav {:fixedflow true
          :className "sub"}
    [:span {:className "control"} "Experiment: " [:b (:name experiment)]]
    [:div {:className "control"
           :style "float: right"}
     [:a {:ui-sref "admin.mturk.hits.new({Title: experiment.name, ExternalURL: site_url + 'experiments/' + experiment.id})"}
      "Prepare HIT"]
     [:a {:href "/experiments/{experiment.id}"
          :target "_blank"} "Public"]
     [:a {:href "/experiments/{experiment.id}/responses?token={experiment.access_token}"
          :target "_blank"}
      "Responses"]]]
   [:section {:className "help hpad"}
    " An experiment is a list of stimuli that will be presented to the participant in sequence. Each item in the experiment is known as a \"block\", and can be pretty much anything, like a consent form, instructions,adaptive classification task, or group of other blocks."]
   [:section {:className "box hpad"}
    [:form {:ng-submit "syncExperiment($event)"}
     [:label {:className "block"}
      [:div [:b "Experiment name"]]
      [:input {:type "text"
               :ng-model "experiment.name"
               :style "width: 200px"}]]
     [:label {:className "block"}
      [:div [:b "Owner"]]
      [:select {:ng-model "experiment.administrator_id"
                :ng-options "administrator.id as administrator.email for administrator in administrators"}]]
     [:div {:className "block"}
      [:label {:style "float: right"}
       [:input {:type "checkbox"
                :ng-model "$storage.expand_experiment_html"}]
       [:span "Expand"]]
      [:label
       [:div
        [:b "Header html"]
        [:span {:className "help"}
         [:div
          "This will be inserted at the top of every page in the experiment, right after the <body> tag. You might put things like inline styles, <script> imports, etc., to give your experiment a unified look or to avoid having to includes those in multiple templates."]]]
       [:textarea {:ng-model "experiment.html"
                   :enhance true
                   :ng-className "{unlimited: $storage.expand_experiment_html}"
                   :className "code"
                   :style "min-height: 40px; max-height: 100px; width: 100%;"}]]]
     [:div {:className "block"} [:button "Save"]]]]
   [:ui-view
    [:section {:className "hpad"}
     [:a {:ui-sref "admin.experiments.edit.blocks"
          :ng-show "experiment.id"}
      "Show blocks"]]]])
