(ns formious.views.templates
  (:require [rum.core :as rum]
            [formious.common :refer [path-for elide ->iso]]))

(defn- delete
  [id]
  ; is this really the best way?
  ; var promise = template.$delete().then(function() {
  ;   $scope.templates.splice($scope.templates.indexOf(template), 1);
  ;   return 'Deleted';
  ; });
  ; NotifyUI.addPromise(promise);
  (println "TODO: actually delete template #" id))

(defn- save
  [id template]
  ; var promise = $scope.template.$save().then(function() {
  ;   $state.go('.', {id: $scope.template.id}, {notify: false});
  ;   return 'Saved template';
  ; });
  ; NotifyUI.addPromise(promise);
  (println "TODO: actually save template #" id template))

; // the 'save' event is broadcast on rootScope when command+S is pressed
; $scope.$on('save', $scope.save);

(defn- copy
  [id]
  ; $state.go('.', {id: 'new'}, {notify: false});
  ; $scope.template = new Template({
  ;   name: $scope.template.name + ' copy',
  ;   html: $scope.template.html,
  ; });
  (println "TODO: actually copy template #" id))

(defn- layout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a.tab {:href (path-for :admin-templates)} "List templates"]
    [:a.tab {:href (path-for :admin-template :id "new")} "New template"]]
   children])

(defn- table
  [templates]
  [:table.fill.padded.striped.lined
   [:thead
    [:tr
     [:th "Name"]
     [:th "HTML"]
     [:th "Created"]
     [:th]]]
   [:tbody
    (for [{:keys [id name html created]} templates]
      [:tr
       [:td {:title id}
        [:a {:href (path-for :admin-template :id id)} name]]
       [:td [:code (elide html 100)]]
       [:td (->iso created :date)]
       [:td [:button {:on-click (fn [_] (delete id))} "Delete"]]])]])

(rum/defc templates
  [templates]
  (layout
   [:div
    [:section.hpad [:h3 "Templates"]]
    [:section.box (table templates)]]))

(rum/defc template
  [{:keys [id name html created] :as record}]
  (layout
   [:div
    [:code (str record)]
    [:section.hpad {:style {:float "right"}}
     [:button {:on-click (fn [_] (copy id))} "Clone"]]
    [:form.hpad {:on-submit (fn [_] (save id {:name name :html html}))}
     [:label.block
      [:div [:b "Name"]]
      [:input {:type "text"
               :defaultValue name
               :style {:width "100%"}}]]
     [:label.block
      [:div [:b "Created"]]
      [:DateTime {:date created}]]
     [:label.block
      [:div [:b "HTML"]]
       ; TODO: enhance textarea
      [:textarea.code {:defaultValue html
                       :placeholder "HTML / Handlebars content"
                       :style {:width "100%" :min-height "200px"}}]]
     [:div.block [:button "Save"]]]]))
