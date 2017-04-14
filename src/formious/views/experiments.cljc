(ns formious.views.experiments
  (:require [rum.core :as rum]
            [formious.routes :as routes]
            [formious.common :refer [path-for ->iso]]))

(defn- experiment-responses-path
  [experiment]
  (path-for :responses :experiment-id (:id experiment) :token (:access_token experiment)))

(defn- experiment-public-path
  [experiment]
  (path-for :experiment (:id experiment)))

(defn- prepare-hit-path
  [experiment]
  (path-for :mturk-hits (:id "new") :Title (:name experiment)
                                    :ExternalURL (str "<<<site_url>>>" "experiments/" (:id experiment))))

(defn- delete
  [experiment]
  (println "TODO: actually delete experiment" (assoc experiment :html "[truncated]")))

(rum/defc ExperimentsLayout
  [children]
  [:div
   [:nav.sub.fixed-flow
    [:a.tab {:href (path-for :experiments)}
     "List experiments"]
    [:a.tab {:href (path-for :experiments :id "new")}
     "New experiment"]]
   children])

(rum/defc ExperimentsTable
  [experiments administrators]
  [:div
   [:section.hpad [:h3 "Experiments"]]
   [:section.box
    [:table.fill.padded.striped.lined
     [:thead [:tr [:th "Name"] [:th "Created"] [:th "Owner"] [:th] [:th] [:th]]]
     [:tbody
      (for [experiment experiments]
        [:tr
         [:td
          [:a {:href (path-for :experiment :id (:id experiment))}
           (:name experiment)]]
         [:td (->iso (:created experiment) :date)]
         [:td
          [:a {:href (path-for :administrator :id (:administrator_id experiment))}
           (->> administrators (filter #(= (:administrator_id experiment) (:id %))) first :email)]]
         [:td
          [:a {:href (experiment-responses-path experiment)
               :target "_blank"} "Responses"]
          " (" (get experiment :responses_count "N/A") ")"]
         [:td {:class "nowrap"}
          [:a {:href (path-for :experiment :id (:id experiment))
               :target "_blank"} "Public"]]
         [:td [:button {:on-click (fn [_] (delete experiment))} "Delete"]]])]]]])

(def $storage {:todo "Pull this from global state"})

(rum/defc ExperimentsEdit
  [experiment]
  [:div
   [:nav.sub.fixed-flow
    [:span.control "Experiment: " [:b (:name experiment)]]
    [:div.control {:style "float: right"}
     [:a {:href (prepare-hit-path experiment)} "Prepare HIT"]
     [:a {:href (experiment-public-path experiment) :target "_blank"} "Public"]
     [:a {:href (experiment-responses-path experiment) :target "_blank"}
      "Responses"]]]
   [:section {:class "help hpad"}
    " An experiment is a list of stimuli that will be presented to the participant in sequence. Each item in the experiment is known as a \"block\", and can be pretty much anything, like a consent form, instructions,adaptive classification task, or group of other blocks."]
   [:section.hpad.box
    [:form {:ng-submit "syncExperiment($event)"}
     [:label.block
      [:div [:b "Experiment name"]]
      [:input {:type "text"
               :ng-model "experiment.name"
               :style "width: 200px"}]]
     [:label.block
      [:div [:b "Owner"]]
      [:select {:ng-model "experiment.administrator_id"
                :ng-options "administrator.id as administrator.email for administrator in administrators"}]]
     [:div.block
      [:label {:style "float: right"}
       [:input {:type "checkbox"
                :ng-model "$storage.expand_experiment_html"}]
       [:span "Expand"]]
      [:label
       [:div
        [:b "Header html"]
        [:span {:class "help"}
         [:div "This will be inserted at the top of every page in the experiment, right after the <body> tag. You might put things like inline styles, <script> imports, etc., to give your experiment a unified look or to avoid having to includes those in multiple templates."]]]
       [:textarea {:ng-model "experiment.html"
                   :enhance true
                   :class (str "code " (when-not (:expand_experiment_html $storage) "unlimited"))
                   :style "min-height: 40px; max-height: 100px; width: 100%;"}]]]
     [:div.block [:button "Save"]]]]
   [:ui-view
    [:section.hpad
     [:a {:href (path-for :api-blocks :experiment-id (:id experiment))
          :ng-show "experiment.id"}
      "Show blocks"]]]])
