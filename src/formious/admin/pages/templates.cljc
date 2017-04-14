(ns formious.admin.pages.templates
  (:require [rum.core :as rum]))

(rum/defc TemplatesLayout
  []
  [:div
   [:nav {:fixedflow true
          :className "sub"}
    [:a {:ui-sref "admin.templates.table"
         :ui-sref-active "current"
         :className "tab"}
     "List templates"]
    [:a {:ui-sref "admin.templates.edit({id: 'new'})"
         :ui-sref-active "current"
         :className "tab"}
     "New template"]]
   children])

; .controller('admin.templates.table', function($scope, Template) {
;   $scope.templates = Template.query();
;   $scope.delete = function(template) {
;     // is this really the best way?
;     var promise = template.$delete().then(function() {
;       $scope.templates.splice($scope.templates.indexOf(template), 1);
;       return 'Deleted';
;     });
;     NotifyUI.addPromise(promise);
;   };
; })

(rum/defc TemplatesTable
  [templates]
  [:div
   [:section {:className "hpad"} [:h3 "Templates"]]
   [:section {:className "box"}
    [:table {:className "striped lined padded fill"}
     [:thead [:tr [:th "Name"] [:th "HTML"] [:th "Created"] [:th]]]
     [:tbody
      (for [template templates]
        [:tr
         [:td {:title "{template.id}"}
          [:a {:ui-sref "admin.templates.edit({id: template.id})"} (:name template)]]
         [:td [:code ((:slice (:html template)) 0 100)]]
         [:td [:DateTime {:date (:created template)}]]
         [:td [:button {:ng-click "delete(template)"} "Delete"]]])]]]])

; .controller('admin.templates.edit', function($scope, $http, $stateParams, $state, $location, Template) {
;   $scope.template = Template.get($stateParams);
;   $scope.sync = function() {
;     var promise = $scope.template.$save().then(function() {
;       $state.go('.', {id: $scope.template.id}, {notify: false});
;       return 'Saved template';
;     });
;     NotifyUI.addPromise(promise);
;   };
;   // the 'save' event is broadcast on rootScope when command+S is pressed
;   $scope.$on('save', $scope.sync);
;   $scope.clone = function() {
;     $state.go('.', {id: 'new'}, {notify: false});
;     $scope.template = new Template({
;       name: $scope.template.name + ' copy',
;       html: $scope.template.html,
;     });
;   };
; });

(rum/defc TemplatesEdit
  []
  [:div
   [:section {:style "float: right"
              :className "hpad"}
    [:button {:ng-click "clone()"} "Clone"]]
   [:form {:ng-submit "sync($event)"
           :className "hpad"}
    [:label {:className "block"}
     [:div [:b "Name"]]
     [:input {:type "text"
              :ng-model "template.name"
              :style "width: 100%;"}]]
    [:label {:className "block"}
     [:div [:b "Created"]]
     [:DateTime {:date (:created template)}]]
    [:label {:className "block"}
     [:div [:b "HTML"]]
     [:textarea {:enhance true
                 :ng-model "template.html"
                 :className "code"
                 :placeholder "HTML / Handlebars content"
                 :style "width: 100%; min-height: 200px;"}]]
    [:div {:className "block"} [:button "Save"]]]])
