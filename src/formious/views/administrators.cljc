(ns formious.views.administrators
  (:require [rum.core :as rum]
            [formious.common :refer [path-for ->iso]]))

(rum/defc AdministratorsLayout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:NavLink {:to "/administrators"} "List administrators"]
    [:NavLink {:to "/administrators/new"} "New administrator"]]
   children])

(rum/defc AdministratorsTable
  [administrators]
  [:div
   [:section.hpad [:h3 "Administrators"]]
   [:section.box
    [:table.striped.lined.padded
     [:thead [:tr [:th "ID"] [:th "Email"] [:th "Created"] [:th]]]
     [:tbody
      (for [administrator administrators]
        [:tr {:key (:id administrator)}
         [:td (:id administrator)]
         [:td
          [:Link {:href (str "/admin/administrators/" (:id administrator) "")}
           (:email administrator)]]
         [:td [:DateTime {:date (:created administrator)}]]
         [:td [:button {:ng-click "delete(administrator)"} "Delete"]]])]]]])

(defn- linkAWSAccount
  [account]
  ; var administrator_aws_account = new AWSAccountAdministrator(account);
  ; administrator_aws_account.administrator_id = $scope.administrator.id;
  ; var promise = administrator_aws_account.$save(function() {
  ;   $scope.administrator_aws_accounts = AWSAccountAdministrator.query({administrator_id: administrator_id});
  ; }).then(function() {
  ;   return 'Saved';
  ; });
  ; NotifyUI.addPromise(promise);
  (println "TODO: actually link account" account))

(rum/defc AdministratorsEdit
  [administrator administrator_aws_accounts aws_accounts new_account]
  [:div
   [:section.hpad [:h3 "Administrator"]]
   [:section.hpad.box
    [:form {:ng-submit "sync($event)"}
     [:label.block
      [:div [:b "Email"]]
      [:input {:type "text"
               :defaultValue (:email administrator)
               :style "width: 200px"}]]
     [:label.block
      [:div
       [:b "Password"]
       [:span {:class "help"} "Leave blank to keep current password"]]
      [:input {:type "password"
               :defaultValue (:password administrator)
               :style "width: 200px"}]]
     [:label.block
      [:div [:b "Created"]]
      [:DateTime (:created administrator)]]
     [:div.block [:button "Save"]]]]
   [:section.hpad [:h3 "AWS Accounts"]]
   [:section.hpad.box
    [:table.lined
     [:thead
      [:tr
       [:th "Name"]
       [:th "Access Key ID"]
       [:th "Priority"]
       [:th "Created"]
       [:th]]]
     [:tbody
      (for [aws_account administrator_aws_accounts]
        [:tr
         [:td
          [:a {:href (path-for :aws_account :id (:id aws_account))}
           (:name aws_account)]]
         [:td (:access_key_id aws_account)]
         [:td (:priority aws_account)]
         [:td [:DateTime {:date (:created aws_account)}]]
         [:td [:button {:ng-click "unlinkAWSAccount(aws_account)"} "Disown"]]])]]
    [:p
     [:select {:defaultValue (:aws_account_id new_account)}
      (for [aws_account aws_accounts]
        [:option {:value (:id aws_account)} (:name aws_account)])]
     [:input {:defaultValue (:priority new_account)
              :type "number"
              :placeholder "priority"}]
     [:button {:on-click (fn [_] (linkAWSAccount new_account))} "Add account"]]]])
