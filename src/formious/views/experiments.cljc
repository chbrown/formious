(ns formious.views.experiments
  (:require [rum.core :as rum]
            [jurl.core :as jurl]
            [formious.views.common :refer [Link Help datetime]]
            [formious.store :refer [app-state]]
            [formious.resources :as resources]
            [formious.routes :as routes :refer [generate-path]]))

(defn- experiment-responses-path
  [experiment]
  (str (generate-path {:endpoint ::routes/responses})
       ; "token" [(:accesstoken experiment)]
       (jurl/map->search {"experiment-id" [(:id experiment)]})))

(defn- experiment-public-path
  [experiment]
  (generate-path {:endpoint ::resources/experiment :group :admin :id (:id experiment)}))

(defn- prepare-hit-path
  [experiment]
  (str (generate-path {:endpoint ::routes/mturk-hit :group :admin :id "new"})
       (jurl/map->search {:Title [(:name experiment)]
                          :ExternalURL [(str "<<<site_url>>>" "experiments/" (:id experiment))]})))

(defn- delete
  [experiment]
  ; (.$delete experiment).then(function() {
  ;     $scope.experiments.splice($scope.experiments.indexOf(experiment), 1)
  ;     return 'Deleted'
  ;   })
  ;   NotifyUI.addPromise(promise)
  (println "TODO: actually delete experiment" (assoc experiment :html "[truncated]")))

(defn layout
  [children]
  [:div
   [:nav.sub.fixedflow
    (Link {:id nil} "List experiments")
    (Link {:id "new"} "New experiments")]
   children])

(rum/defc experiments < rum/reactive []
  ; [experiments administrators]
  (let [*experiments (rum/cursor-in app-state [::resources/experiment])
        *administrators (rum/cursor-in app-state [::resources/administrator])]
    [:div
     [:section.hpad [:h3 "Experiments"]]
     [:section.box
      [:table.fill.padded.striped.lined
       [:thead [:tr [:th "Name"] [:th "Created"] [:th "Owner"] [:th] [:th] [:th]]]
       [:tbody
        (for [{:keys [id name administrator_id created] :as experiment} (vals (rum/react *experiments))]
          [:tr {:key id}
           [:td
            [:a {:href (generate-path {:endpoint ::resources/experiment :group :admin :id id})} name]]
           [:td (datetime created :date)]
           [:td
            [:a {:href (generate-path {:endpoint ::resources/administrator :group :admin :id administrator_id})}
             (->> (rum/react *administrators) (filter #(= administrator_id (:id %))) first :email)]]
           [:td
            [:a {:href (experiment-responses-path experiment)
                 :target "_blank"} "Responses"]
            " (" (get experiment :responses_count "N/A") ")"]
           [:td.nowrap
            [:a {:href (generate-path {:endpoint ::routes/experiment :id id})
                 :target "_blank"} "Public"]]
           [:td [:button {:on-click (fn [_] (delete experiment))} "Delete"]]])]]]]))

(def $storage {:todo "Pull this from global state"})

(rum/defc experiment
  [experiment]
  [:div
   [:nav.sub.fixedflow
    [:span.control "Experiment: " [:b (:name experiment)]]
    [:div.control {:style {:float "right"}}
     [:a {:href (prepare-hit-path experiment)} "Prepare HIT"]
     [:a {:href (experiment-public-path experiment) :target "_blank"} "Public"]
     [:a {:href (experiment-responses-path experiment) :target "_blank"} "Responses"]]]
   [:section.hpad (Help "An experiment is a list of stimuli that will be presented to the participant in sequence. Each item in the experiment is known as a \"block\", and can be pretty much anything, like a consent form, instructions, adaptive classification task, or group of other blocks.")]
   [:section.hpad.box
    [:form {:ng-submit "syncExperiment($event)"}
     [:label.block
      [:div [:b "Experiment name"]]
      [:input {:type "text"
               :ng-model "experiment.name"
               :style {:width "200px"}}]]
     [:label.block
      [:div [:b "Owner"]]
      [:select {:ng-model "experiment.administrator_id"
                :ng-options "administrator.id as administrator.email for administrator in administrators"}]]
     [:div.block
      [:label {:style {:float "right"}}
       [:input {:type "checkbox"
                :ng-model "$storage.expand_experiment_html"}]
       [:span "Expand"]]
      [:label
       [:div
        [:b "Header html"]
        [:div (Help "This will be inserted at the top of every page in the experiment, right after the <body> tag. You might put things like inline styles, <script> imports, etc., to give your experiment a unified look or to avoid having to includes those in multiple templates.")]]
       [:textarea {:ng-model "experiment.html"
                   :enhance true
                   :class (str "code " (when-not (:expand_experiment_html $storage) "unlimited"))
                   :style {:min-height "40px" :max-height "100px" :width "100%"}}]]]
     [:div.block [:button "Save"]]]]
   [:section.hpad
    (when-let [experiment_id (:id experiment)]
      (Link {:endpoint ::resources/block :experiment_id experiment_id} "Show blocks"))]])
