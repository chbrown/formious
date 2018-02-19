(ns formious.views.administrators
  (:require [rum.core :as rum]
            [formious.views.common :refer [Link Help css-classes datetime table table-container]]
            [formious.store :refer [app-state]]
            [formious.resources :as resources]
            [formious.routes :refer [generate-path]]))

(defn layout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a.tab {:href (generate-path {:endpoint ::resources/administrator :group :admin})} "List administrators"]
    [:a.tab {:href (generate-path {:endpoint ::resources/administrator :group :admin :id "new"})} "New administrator"]]
   children])

(defn- delete
  [id]
  (println "TODO: actually delete administrator #" id))

(def administrators-columns
  ["ID" "Email" "Created" ""])
(defn administrators-cells
  [{:keys [id email created]}]
  [id
   [:a {:href (generate-path {:endpoint ::resources/administrator :group :admin :id id})} email]
   (datetime created)
   [:button {:on-click (fn [e] (delete id))} "Delete"]])

(rum/defc administrators < rum/reactive []
  (let [*administrators (rum/cursor app-state ::resources/administrator)]
    (table-container "Administrators" (vals (rum/react *administrators))
                     administrators-columns administrators-cells (:default-table css-classes))))

(defn- save
  [administrator]
  (println "TODO: actually save administrator" administrator))

(defn- linkAWSAccount
  [account]
  ; the following clojure is a mockery of a translation from the original javascript
  ; (let [awsaccount_administrator (-> (map->AWSAccountAdministrator (account))
  ;                                    (assoc :administrator_id (-> scope :administrator :id)))]
  ;   (save! awsaccount_administrator)
  ;   (let [awsaccount_administrators (AWSAccountAdministrator/query {:administrator_id administrator_id})]
  ;     (swap! *scope assoc :awsaccount_administrators awsaccount_administrators)
  ;     (swap! *scope assoc :message "Saved")))
  (println "TODO: actually link account" account))

(defn- unlinkAWSAccount
  [id]
  (println "TODO: actually unlink account #" id))

(def ^:private accounts-columns
  ["Name" "Access Key ID" "Priority" "Created" ""])
(defn- accounts-cells
  [{:keys [id name access_key_id priority created] :as awsaccount}]
  [[:a {:href (generate-path {:endpoint ::resources/awsaccount :id id})} name]
   access_key_id
   priority
   (datetime created :date)
   [:button {:on-click (fn [e] (unlinkAWSAccount id))} "Disown"]])

(rum/defc administrator < rum/reactive []
  (let [*route (rum/cursor app-state :route)
        administrator-id (:id (rum/react *route))
        *administrator (rum/cursor-in app-state [::resources/administrator administrator-id])
        {:keys [email password created] :as administrator} (rum/react *administrator)
        *awsaccounts (rum/cursor app-state ::resources/awsaccount)
        awsaccounts (vals (rum/react *awsaccounts))
        new-account {:TODO "FIXME"}]
    [:div
     [:section.hpad [:h3 "Administrator"]]
     [:section.hpad.box
      [:form {:on-submit (fn [e] (save administrator))}
       [:label.block
        [:div [:b "Email"]]
        [:input {:type "text"
                 :style {:width "200px"}
                 :default-value email}]]
       [:label.block
        [:div
         [:b "Password"]
         (Help "Leave blank to keep current password")]
        [:input {:type "password"
                 :style {:width "200px"}
                 :default-value password}]]
       [:label.block
        [:div [:b "Created"]]
        (datetime created)]
       [:div.block [:button "Save"]]]]
     [:section.hpad [:h3 "AWS Accounts"]]
     [:section.hpad.box
      (table awsaccounts accounts-columns accounts-cells "lined")
      [:p
       [:select {:default-value (:awsaccount_id new-account)}
        (for [awsaccount awsaccounts]
          [:option {:value (:id awsaccount)} (:name awsaccount)])]
       [:input {:default-value (:priority new-account)
                :type "number"
                :placeholder "priority"}]
       [:button {:on-click (fn [_] (linkAWSAccount new-account))} "Add account"]]]]))
