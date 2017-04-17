(ns formious.views.administrators
  (:require [rum.core :as rum]
            [formious.views.common :refer [css-classes datetime table table-container]]
            [formious.common :refer [path-for ->iso]]))

(defn layout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a {:href (path-for :admin-administrators)} "List administrators"]
    [:a {:href (path-for :admin-administrator :id "new")} "New administrator"]]
   children])

(defn- delete
  [id]
  (println "TODO: actually delete administrator #" id))

(def administrators-columns ["ID" "Email" "Created" ""])
(defn administrators-cells
  [{:keys [id email created]}]
  [id
   [:a {:href (str "/admin/administrators/" id)} email]
   (datetime created)
   [:button {:on-click (fn [e] (delete id))} "Delete"]])

(rum/defc AdministratorsTable
  [administrators]
  (layout
   (table-container "Administrators" administrators
                    administrators-columns administrators-cells (:default-table css-classes))))

(defn- save
  [administrator]
  (println "TODO: actually save administrator" administrator))

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

(defn- unlinkAWSAccount
  [id]
  (println "TODO: actually unlink account #" id))

(def accounts-columns ["Name" "Access Key ID" "Priority" "Created" ""])
(defn accounts-cells
  [{:keys [id name access_key_id priority created] :as aws_account}]
  [[:a {:href (path-for :admin-aws-account :id id)} name]
   access_key_id
   priority
   (datetime created :date)
   [:button {:on-click (fn [e] (unlinkAWSAccount id))} "Disown"]])

(rum/defc AdministratorsEdit
  [administrator administrator_aws_accounts aws_accounts new_account]
  [:div
   [:section.hpad [:h3 "Administrator"]]
   [:section.hpad.box
    [:form {:on-submit (fn [e] (save administrator))}
     [:label.block
      [:div [:b "Email"]]
      [:input {:type "text"
               :default-value (:email administrator)
               :style {:width "200px"}}]]
     [:label.block
      [:div
       [:b "Password"]
       [:span {:class "help"} "Leave blank to keep current password"]]
      [:input {:type "password"
               :default-value (:password administrator)
               :style {:width "200px"}}]]
     [:label.block
      [:div [:b "Created"]]
      [:DateTime (:created administrator)]]
     [:div.block [:button "Save"]]]]
   [:section.hpad [:h3 "AWS Accounts"]]
   [:section.hpad.box
    (table aws_accounts accounts-columns accounts-cells "lined")
    [:p
     [:select {:default-value (:aws_account_id new_account)}
      (for [aws_account aws_accounts]
        [:option {:value (:id aws_account)} (:name aws_account)])]
     [:input {:default-value (:priority new_account)
              :type "number"
              :placeholder "priority"}]
     [:button {:on-click (fn [_] (linkAWSAccount new_account))} "Add account"]]]])
