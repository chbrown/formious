(ns formious.views.templates
  (:require [rum.core :as rum]
            [formious.views.common :refer [css-classes datetime table table-container Link]]
            [formious.util :refer [elide]]
            [formious.store :refer [app-state]]
            [formious.resources :as resources]
            [formious.routes :refer [generate-path]]))

; (defn findOrCreateTemplate
;   "If `context` has a template_id field, return an initialized (but not
;   saturated) Template with `template_id` as the `id`. Otherwise fetch all the
;   templates and find one where `name` == `context.template` otherwise, create
;   a new Template with {name: `context.template`} and return it."
;   [context]
;   ; presumably, context.template is the desired Template's name
;   (let [{:keys [template_id template]} context]
;     (if template_id
;       (Template. {:id template_id})
;       (let [templates (Template/query)
;             template (filter #(= (:template context) (:name %)) templates)]
;           (or template (Template. {:name template}))))))

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

(defn- template-link
  [{:keys [id name]}]
  [:a {:href (generate-path {:endpoint ::resources/template :group :admin :id id})} name])

(rum/defc layout
  [children]
  [:div
   [:nav.sub.fixedflow
    (Link {:id nil} "List templates")
    (Link {:id "new"} "New template")]
   children])

(def ^:private columns
  ["Name" "HTML" "Created" ""])

(defn- cells
  [{:keys [id name html created]}]
  [[:a {:title id :href (generate-path {:endpoint ::resources/template :group :admin :id id})} name]
   [:code (elide html 100)]
   (datetime created :date)
   [:button {:on-click (fn [_] (delete id))} "Delete"]])

(rum/defc templates < rum/reactive []
  (let [*templates (rum/cursor app-state ::resources/template)]
    (table-container "Templates" (vals (rum/react *templates))
                     columns cells (:default-table css-classes))))

(rum/defc template < rum/reactive []
  (let [*route (rum/cursor app-state :route)
        *template (rum/cursor-in app-state [::resources/template (:id (rum/react *route))])
        {:keys [id name html created] :as template} (rum/react *template)]
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
       [:div [:b "HTML"]]
        ; TODO: enhance textarea
       [:textarea.code {:default-value html
                        :placeholder "HTML / Handlebars content"
                        :style {:width "100%" :min-height "200px"}}]]
      [:label.block
       [:div [:b "Created"]]
       (datetime created)]
      [:div.block [:button "Save"]]]]))
