(ns formious.admin.pages.administrators
  (:require [rum.core :as rum]))

(rum/defc AdministratorsLayout
  []
  [:div
   [:nav {:fixedflow true
          :className "sub"}
    [:NavLink {:to "/administrators"} "List administrators"]
    [:NavLink {:to "/administrators/new"} "New administrator"]]
   children])

(rum/defc AdministratorsTable
  []
  ; componentDidMount() {
  ;   fetch('/api/administrators/').then(administrators => {
  ;     this.setState({administrators});
  ;   });
  ; }
  ; delete(administrator) {
  ;   var promise = administrator.$delete().then(function() {
  ;     $scope.administrators.splice($scope.administrators.indexOf(administrator), 1);
  ;     return 'Deleted';
  ;   });
  ;   NotifyUI.addPromise(promise);
  ; }
  [:div
   [:section {:className "hpad"} [:h3 "Administrators"]]
   [:section {:className "box"}
    [:table {:className "striped lined padded"}
     [:thead [:tr [:th "ID"] [:th "Email"] [:th "Created"] [:th]]]
     [:tbody
      [:tr {:key (:id administrator)}
       [:td (:id administrator)]
       [:td
        [:Link {:href (str "/admin/administrators/" (:id administrator) "")}
         (:email administrator)]]
       [:td [:DateTime {:date (:created administrator)}]]
       [:td [:button {:ng-click "delete(administrator)"} "Delete"]]]]]]])

; componentDidMount() {
;   const {id} = this.props;
;   fetch(`/api/administrator/${id}`).then(administrator => {
;     this.setState({administrator});
;   });
;   var administrator_id = $stateParams.id;
;   $scope.aws_accounts = AWSAccount.query();
;   $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
; }
; // $scope.$on('save', $scope.sync);
; sync() {
;   var promise = $scope.administrator.$save().then(function() {
;     return 'Saved';
;   });
;   NotifyUI.addPromise(promise);
; }
; unlinkAWSAccount(account) {
;   account.$delete(function() {
;     $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
;   });
; }
; linkAWSAccount(account) {
;   var administrator_aws_account = new AWSAccountAdministrator(account);
;   administrator_aws_account.administrator_id = $scope.administrator.id;
;   var promise = administrator_aws_account.$save(function() {
;     $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
;   }).then(function() {
;     return 'Saved';
;   });
;   NotifyUI.addPromise(promise);
; }
(rum/defc AdministratorsEdit
  [administrator_aws_accounts]
  [:div
   [:section {:className "hpad"} [:h3 "Administrator"]]
   [:section {:className "box hpad"}
    [:form {:ng-submit "sync($event)"}
     [:label {:className "block"}
      [:div [:b "Email"]]
      [:input {:type "text"
               :ng-model "administrator.email"
               :style "width: 200px"}]]
     [:label {:className "block"}
      [:div
       [:b "Password"]
       [:span {:className "help"} "Leave blank to keep current password"]]
      [:input {:type "password"
               :ng-model "administrator.password"
               :style "width: 200px"}]]
     [:label {:className "block"}
      [:div [:b "Created"]]
      [:DateTime (:created administrator)]]
     [:div {:className "block"} [:button "Save"]]]]
   [:section {:className "hpad"} [:h3 "AWS Accounts"]]
   [:section {:className "box hpad"}
    [:table {:className "lined"}
     [:thead
      [:tr [:th "Name"] [:th "Access Key ID"] [:th "Priority"] [:th "Created"] [:th]]]
     [:tbody
      (for [aws_account administrator_aws_accounts]
        [:tr
         [:td
          [:a {:ui-sref "admin.aws_accounts.edit({id: aws_account.id})"}
           (:name aws_account)]]
         [:td (:access_key_id aws_account)]
         [:td (:priority aws_account)]
         [:td [:DateTime {:date (:created aws_account)}]]
         [:td [:button {:ng-click "unlinkAWSAccount(aws_account)"} "Disown"]]])]]
    [:p
     [:select {:ng-model "new_account.aws_account_id"
               :ng-options "aws_account.id as aws_account.name for aws_account in aws_accounts"}]
     [:input {:ng-model "new_account.priority"
              :type "number"
              :placeholder "priority"}]
     [:button {:ng-click "linkAWSAccount(new_account)"} "Add account"]]]])
