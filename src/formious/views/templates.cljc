(ns formious.views.templates
  (:require [rum.core :as rum]))

(rum/defc TemplatesLayout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a.tab {:ui-sref "admin.templates.table"}
     "List templates"]
    [:a.tab {:ui-sref "admin.templates.edit({id: 'new'})"}
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
   [:section.hpad [:h3 "Templates"]]
   [:section.box
    [:table.fill.padded.striped.lined
     [:thead
      [:tr
        [:th "Name"]
        [:th "HTML"]
        [:th "Created"]
        [:th]]]
     [:tbody
      (for [template templates]
        [:tr
         [:td {:title (:id template)}
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
  [template]
  [:div
   [:section.hpad {:style "float: right"}
    [:button {:ng-click "clone()"} "Clone"]]
   [:form.hpad {:ng-submit "sync($event)"}
    [:label.block
     [:div [:b "Name"]]
     [:input {:type "text"
              :ng-model "template.name"
              :style "width: 100%;"}]]
    [:label.block
     [:div [:b "Created"]]
     [:DateTime {:date (:created template)}]]
    [:label.block
     [:div [:b "HTML"]]
     [:textarea {:enhance true
                 :ng-model "template.html"
                 :class "code"
                 :placeholder "HTML / Handlebars content"
                 :style "width: 100%; min-height: 200px;"}]]
    [:div.block [:button "Save"]]]])
