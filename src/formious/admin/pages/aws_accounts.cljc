(ns formious.admin.pages.aws-accounts
  (:require [rum.core :as rum]))

; import {NotifyUI} from 'notify-ui';

(rum/defc AWSAccountsLayout
  []
  [:div
   [:nav {:fixedflow true
          :className "sub"}
    [:a {:ui-sref "admin.aws_accounts.table"
         :ui-sref-active "current"
         :className "tab"}
     "List AWS Accounts"]
    [:a {:ui-sref "admin.aws_accounts.edit({id: 'new'})"
         :ui-sref-active "current"
         :className "tab"}
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
   [:section {:className "hpad"} [:h3 "AWS Accounts"]]
   [:section {:className "box"}
    [:table {:className "striped lined padded fill"}
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
  []
  [:div
   [:section {:className "hpad"} [:h3 "AWS Account: " (:name aws_account)]]
   [:section {:className "box hpad"}
    [:form {:ng-submit "sync($event)"}
     [:label {:className "block"}
      [:div [:b "Name"]]
      [:input {:type "text"
               :ng-model "aws_account.name"}]]
     [:label {:className "block"}
      [:div [:b "Access Key ID"]]
      [:input {:type "text"
               :ng-model "aws_account.access_key_id"
               :style "width: 400px"}]]
     [:label {:className "block"}
      [:div [:b "Secret Access Key"]]
      [:input {:type "text"
               :ng-model "aws_account.secret_access_key"
               :style "width: 400px"}]]
     [:label {:className "block"}
      [:div [:b "Created"]]
      [:DateTime {:date (:created aws_account)}]]
     [:div {:className "block"} [:button "Save"]]]]])
