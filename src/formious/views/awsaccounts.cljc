(ns formious.views.awsaccounts
  (:require [rum.core :as rum]
            [formious.views.common :refer [Link datetime table-container]]
            [formious.store :refer [app-state]]
            [formious.resources :as resources]
            [formious.routes :refer [generate-path]]))

(defn layout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a.tab {:href (generate-path {:endpoint ::resources/awsaccount :group :admin})} "List AWS Accounts"]
    [:a.tab {:href (generate-path {:endpoint ::resources/awsaccount :group :admin :id "new"})} "New AWS Account"]]
   children])

; .controller('admin.awsaccounts.table', function($scope, AWSAccount) {
;   $scope.awsaccounts = AWSAccount.query()
;   $scope.delete = function(awsaccount) {
;     awsaccount.$delete(function() {
;       $scope.awsaccounts = AWSAccount.query()
;     })
;   }
; })

(defn- delete
  [id]
  (println "TODO: actually delete awsaccount #" id))

(defn- awsaccount->cells
  [{:keys [id name access_key_id secret_access_key created]}]
  [[:a {:href (generate-path {:endpoint ::resources/awsaccount :group :admin :id id})} name]
   access_key_id
   secret_access_key
   (datetime created :date)
   [:button {:on-click (fn [_] (delete id))} "Delete"]])

(rum/defc awsaccounts < rum/reactive []
  (let [*awsaccounts (rum/cursor app-state ::resources/awsaccount)
        awsaccounts (vals (rum/react *awsaccounts))]
    (table-container
     "AWS Accounts"
     ["Name" "Access Key ID" "Secret Access Key" "Created" ""]
     (map awsaccount->cells awsaccounts))))

(defn on-awsaccount-save
  []
  ; $scope.awsaccount.$save()
  ; NotifyUI.addPromise(promise)
  (println "Actually save awsaccount"))

(rum/defc awsaccount < rum/reactive []
  (let [*route (rum/cursor app-state :route)
        *awsaccount (rum/cursor-in app-state [::resources/awsaccount (:id (rum/react *route))])
        {:keys [id name access_key_id secret_access_key created] :as awsaccount} (rum/react *awsaccount)]
    [:div
     [:section.hpad [:h3 "AWS Account: " name]]
     [:section.hpad.box
      [:form {:ng-submit "sync($event)"}
       [:label.block
        [:div [:b "Name"]]
        [:input {:type "text"
                 :default-value name}]]
       [:label.block
        [:div [:b "Access Key ID"]]
        [:input {:type "text"
                 :style {:width "400px"}
                 :default-value access_key_id}]]
       [:label.block
        [:div [:b "Secret Access Key"]]
        [:input {:type "text"
                 :style {:width "400px"}
                 :default-value secret_access_key}]]
       [:label.block
        [:div [:b "Created"]]
        (datetime created :date)]
       [:div.block [:button "Save"]]]]]))
