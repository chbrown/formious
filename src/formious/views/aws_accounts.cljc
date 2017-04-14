(ns formious.views.aws-accounts
  (:require [rum.core :as rum]))

(rum/defc AWSAccountsLayout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a.tab {:ui-sref "admin.aws_accounts.table"}
     "List AWS Accounts"]
    [:a.tab {:ui-sref "admin.aws_accounts.edit({id: 'new'})"}
     "New AWS Account"]]
   children])

; .controller('admin.aws_accounts.table', function($scope, AWSAccount) {
;   $scope.aws_accounts = AWSAccount.query();
;   $scope.delete = function(aws_account) {
;     aws_account.$delete(function() {
;       $scope.aws_accounts = AWSAccount.query();
;     });
;   };
; })

(rum/defc AWSAccountsTable
  [aws_accounts]
  [:div
   [:section.hpad [:h3 "AWS Accounts"]]
   [:section.box
    [:table.fill.padded.striped.lined
     [:thead
      [:tr
       [:th "Name"]
       [:th "Access Key ID"]
       [:th "Secret Access Key"]
       [:th "Created"]
       [:th]]]
     [:tbody
      (for [aws_account aws_accounts]
        [:tr
         [:td
          [:a {:ui-sref "admin.aws_accounts.edit({id: aws_account.id})"}
           (:name aws_account)]]
         [:td (:access_key_id aws_account)]
         [:td (:secret_access_key aws_account)]
         [:td [:DateTime {:date (:created aws_account)}]]
         [:td [:button {:ng-click "delete(aws_account)"} "Delete"]]])]]]])

; .controller('admin.aws_accounts.edit', function($scope, $http, $turk, $stateParams, AWSAccount) {
;   $scope.aws_account = AWSAccount.get($stateParams);
;   $scope.sync = function() {
;     var promise = $scope.aws_account.$save().then(function() {
;       return 'Saved';
;     });
;     NotifyUI.addPromise(promise);
;   };
;   $scope.$on('save', $scope.sync);
; });

(rum/defc AWSAccountsEdit
  [aws_account]
  [:div
   [:section.hpad [:h3 "AWS Account: " (:name aws_account)]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:label.block
      [:div [:b "Name"]]
      [:input {:type "text"
               :ng-model "aws_account.name"}]]
     [:label.block
      [:div [:b "Access Key ID"]]
      [:input {:type "text"
               :ng-model "aws_account.access_key_id"
               :style {:width "400px"}}]]
     [:label.block
      [:div [:b "Secret Access Key"]]
      [:input {:type "text"
               :ng-model "aws_account.secret_access_key"
               :style {:width "400px"}}]]
     [:label.block
      [:div [:b "Created"]]
      [:DateTime {:date (:created aws_account)}]]
     [:div.block [:button "Save"]]]]])
