(ns formious.views.aws-accounts
  (:require [rum.core :as rum]
            [formious.views.common :refer [css-classes datetime table-container]]
            [formious.common :refer [path-for ->iso]]))

(defn layout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a.tab {:href (path-for :admin-aws-accounts)} "List AWS Accounts"]
    [:a.tab {:href (path-for :admin-aws-account :id "new")} "New AWS Account"]]
   children])

; .controller('admin.aws_accounts.table', function($scope, AWSAccount) {
;   $scope.aws_accounts = AWSAccount.query();
;   $scope.delete = function(aws_account) {
;     aws_account.$delete(function() {
;       $scope.aws_accounts = AWSAccount.query();
;     });
;   };
; })

(defn- delete
  [id]
  (println "TODO: actually delete aws_account #" id))

(def columns ["Name" "Access Key ID" "Secret Access Key" "Created" ""])

(defn cells
  [{:keys [id name access_key_id secret_access_key created]}]
  [[:a {:href (path-for :admin-aws-account :id id)} name]
   access_key_id
   secret_access_key
   (datetime created :date)
   [:button {:on-click (fn [_] (delete id))} "Delete"]])

(rum/defc aws-accounts
  [aws_accounts]
  (layout
   (table-container "AWS Accounts" aws_accounts columns cells (:default-table css-classes))))

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

(rum/defc aws-account
  [aws_account]
  [:div
   [:section.hpad [:h3 "AWS Account: " (:name aws_account)]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:label.block
      [:div [:b "Name"]]
      [:input {:type "text"
               :default-value (:name aws_account)}]]
     [:label.block
      [:div [:b "Access Key ID"]]
      [:input {:type "text"
               :default-value (:access_key_id aws_account)
               :style {:width "400px"}}]]
     [:label.block
      [:div [:b "Secret Access Key"]]
      [:input {:type "text"
               :default-value (:secret_access_key aws_account)
               :style {:width "400px"}}]]
     [:label.block
      [:div [:b "Created"]]
      (datetime (:created aws_account) :date)]
     [:div.block [:button "Save"]]]]])
