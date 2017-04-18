(ns formious.views.templates
  (:require [rum.core :as rum]
            [formious.views.common :refer [css-classes datetime table]]
            [formious.common :refer [path-for elide]]))

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

(defn template-link
  [templates id]
  ; const {id} = this.props;
  ; fetch(`/api/templates/${id}`).then(template => {
  ;   this.setState({template});
  ; });
  (let [template (->> templates (filter #(= (:id %) id)) first)]
    [:a {:href (path-for :admin-template :id id)} (:name template)]))

(defn- layout
  [children]
  [:div
   [:nav.sub.fixedflow
    [:a.tab {:href (path-for :admin-templates)} "List templates"]
    [:a.tab {:href (path-for :admin-template :id "new")} "New template"]]
   children])

(def columns ["Name" "HTML" "Created" ""])

(defn cells
  [{:keys [id name html created]}]
  [[:a {:title id :href (path-for :admin-template :id id)} name]
   [:code (elide html 100)]
   (datetime created :date)
   [:button {:on-click (fn [_] (delete id))} "Delete"]])

(rum/defc templates
  [templates]
  (layout
   [:div
    [:section.hpad [:h3 "Templates"]]
    [:section.box (table templates columns cells (:default-table css-classes))]]))

(rum/defc template
  [{:keys [id name html created] :as record}]
  (layout
   [:div
    [:section.hpad {:style {:float "right"}}
     [:button {:on-click (fn [_] (copy id))} "Clone"]]
    [:form.hpad {:on-submit (fn [_] (save id {:name name :html html}))}
     [:label.block
      [:div [:b "Name"]]
      [:input {:type "text"
               :default-value name
               :style {:width "100%"}}]]
     [:label.block
      [:div [:b "Created"]]
      (datetime created)]
     [:label.block
      [:div [:b "HTML"]]
       ; TODO: enhance textarea
      [:textarea.code {:default-value html
                       :placeholder "HTML / Handlebars content"
                       :style {:width "100%" :min-height "200px"}}]]
     [:div.block [:button "Save"]]]]))
