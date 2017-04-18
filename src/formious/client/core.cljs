(ns formious.client.core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [clojure.string :as str]
            [cljs.core.async :refer [<!]]
            [cljs-http.client :as http]
            [formious.common :refer [match-route path-for]]
            [formious.client.common :refer [full-location parse-json any-modKey?]]
            [formious.client.state :refer [app-state]]
            [formious.routes :as routes]
            [formious.views.common :refer [not-found]]
            [formious.views.access-tokens :as access-tokens]
            [formious.views.experiments :as experiments]
            ; [formious.views [experiments :as experiments]] ; apparently not supported by CLJS
            [rum.core :as rum]))

(enable-console-print!)

;; for dev:
; (require '[clojure.pprint :refer [pprint]])
; (require '[clojure.tools.namespace.repl :refer [refresh]])
;; and:
; (in-ns 'formious.client.core)

(def route-state (rum/cursor-in app-state [:route]))

(defonce root-element (js/document.getElementById "app"))

(defn get-and-reset!
  [url state-cursor]
  (go (->> (<! (http/get url))
           :body
           (reset! state-cursor))))

; mapping from routes (qualified keyword endpoints) to [component update-state-fn!] tuples
(def route->component {
  ::routes/admin-access-tokens (let [access-tokens-atom (rum/cursor-in app-state [:access-tokens])]
                                 [#(access-tokens/access-tokens-reactive access-tokens-atom)
                                  #(get-and-reset! "/api/access-tokens" access-tokens-atom)])
})

(defn render!
  "Main attachment point; calls rum/mount"
  []
  (println "render! full-location:" (full-location))
  (if-let [{:keys [handler route-params]} (:route @app-state)]
    (let [[component-fn update-state!] (route->component handler)]
      (println "rendering handler" handler "with route-params" route-params) ; "and state" @app-state
      (update-state!)
      (rum/mount (component-fn) root-element))
    (rum/mount (not-found (full-location)) root-element)))

(defn set-location!
  "This is called once at root level, then on (specific) document 'click' events and 'popstate' events"
  [path]
  (swap! app-state assoc :route (match-route path)))

(defn document-click
  "Listener for all document clicks that filters out all non-inbound/in-app link clicks"
  [e]
  (let [el (.-target e)
        href (.getAttribute el "href")
        path (.-pathname el) ; (-> path Uri.parse .getPath)
        route (match-route path)]
    ; only intercept...
    (when (and
           (= (.-tagName el) "A") ; anchor elements
           (not (str/starts-with? (.-hash el) "#")) ; that aren't hash links
           (not= (.-target el) "_blank") ; with normal targets
           (= (.-host el) js/window.location.host) ; to the same host
           (not (any-modKey? e)) ; without a modifier key
           (= (.-button e) 0) ; left mouse button
           (some? route)) ; goes to some route we handle
      (js/history.pushState nil "" path)
      (set-location! path)
      (.preventDefault e))))

(defn route-state-watch-fn
  [key reference old-state new-state]
  (println "route-state-watch-fn" key old-state new-state)
  (render!))

(defn init! []
  (println "init!")
  (set-location! (full-location))
  (js/document.addEventListener "click" document-click)
  (js/window.addEventListener "popstate" #(set-location! (full-location)))
  ; > The watch fn must be a fn of 4 args: a key, the reference, its old-state, its new-state
  (add-watch route-state :on-change route-state-watch-fn)
  (render!))

(defn figwheel-on-jsload!
  []
  (println "figwheel-on-jsload!")
  (render!))

(js/document.addEventListener "DOMContentLoaded" init!)

; (defn loadExperiments
;   []
;   {:experiments Experiment.query()
;    :administrators Administrator.query()})

; (defn deleteExperiment
;   [experiment]
;   (.$delete experiment).then(function() {
;       $scope.experiments.splice($scope.experiments.indexOf(experiment), 1);
;       return 'Deleted';
;     });
;     NotifyUI.addPromise(promise);
;   ))

; .controller('admin.experiments.edit', function($scope, $state, $localStorage,
;     Experiment, Template, Administrator) {
;   $scope.$storage = $localStorage.$default({expand_experiment_html: false});
;   var experiment = $scope.experiment = Experiment.get({id: $state.params.experiment_id});
;   // $scope.aws_accounts = AWSAccount.query();
;   $scope.administrators = Administrator.query();
;   $scope.templates = Template.query();
;   $scope.syncExperiment = function() {
;     var promise = experiment.$save(function() {
;       $state.go('.', {experiment_id: experiment.id}, {notify: false});
;     }).then(function() {
;       return 'Saved experiment';
;     });
;     NotifyUI.addPromise(promise);
;   };
;   // the 'save' event is broadcast on rootScope when command+S is pressed
;   $scope.$on('save', $scope.syncExperiment);
;   // generate link to hit creation page
;   $scope.site_url = Url.parse(window.location).merge({path: '/'}).toString();
; });

; $scope.access_tokens = AccessToken.query();
; $scope.delete = function(index) {
;   var promise = $scope.access_tokens[index].$delete().then(function() {
;     $scope.access_tokens.splice(index, 1);
;     return 'Deleted';
;   });
;   NotifyUI.addPromise(promise);
; };

; AdministratorsTable
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

; (defn findOrCreateTemplate
;   "If `context` has a template_id field, return an initialized (but not
;   saturated) Template with `template_id` as the `id`. Otherwise fetch all the
;   templates and find one where `name` == `context.template` otherwise, create
;   a new Template with {name: `context.template`} and return it."
;   [context]
;   (if (:template_id context)
;     (Template. {:id (:template_id context)})
;     ; presumably, context.template is the desired Template's name
;     (let [templates (Template/query)
;           template (filter #(= (:template context) (:name %)) templates)]
;         (or template (Template. {:name name})))))
