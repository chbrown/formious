(ns formious.client.core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [clojure.string :as str]
            [bidi.bidi :refer [match-route path-for]]
            [cljs.core.async :refer [<!]]
            [cljs-http.client :as http]
            [formious.client.common :refer [full-location parse-json any-modKey?]]
            [formious.client.state :refer [app-state]]
            [formious.routes :as routes]
            [formious.views.experiments :as experiments]
            ; [formious.views [experiments :as experiments]] ; apparently not supported by CLJS
            [rum.core :as rum]))

;; for dev:
; (require '[clojure.pprint :refer [pprint]])
; (require '[clojure.tools.namespace.repl :refer [refresh]])
;; and:
; (in-ns 'formious.client.core)

(enable-console-print!)

(defonce root-element (js/document.getElementById "app"))

(defn fetch-experiments
  []
  (when (nil? (:experiments @app-state))
    (swap! app-state assoc :experiments [])
    (go (->> (<! (http/get "/api/experiments"))
             :body
             (swap! app-state assoc :experiments)))))

; mapping from routes to [component update-state-fn!]
(def route->component {
  ::routes/layout [#(experiments/ExperimentsTable (:experiments @app-state)) fetch-experiments]
})

(defn render! []
  ; (println "full-location" (full-location) "router" )
  (let [route (:route @app-state)
        [component update-state!] (route->component (:handler route))]
        ; {:keys [handler route-params]} (bidi/match-route routes path)
        ; {:keys [component load!]} (handler route-params)]
    (println "rendering route" route)
    ; (println "with state" @app-state)
    (update-state!)
    (rum/mount (component) root-element)))
    ; (println "render!" "..." (:route-params route)) ; (:handler route)

(defn set-location
  "set-location is called once at root level, on (specific) document 'click' events, and 'popstate' events"
  [path]
  (let [route (match-route routes/routes path)]
    (swap! app-state assoc :route route)))

(defn document-click
  "Listener for all document clicks that filters out all non-inbound/in-app link clicks"
  [e]
  (let [el (.-target e)
        href (.getAttribute el "href")
        path (.-pathname el) ; (-> path Uri.parse .getPath)
        route (match-route routes/routes path)]
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
      (set-location path)
      (.preventDefault e))))

(defn init! []
  (println "init!")
  (set-location (full-location))
  (js/document.addEventListener "click" document-click)
  (js/window.addEventListener "popstate" #(set-location (full-location)))
  ; (add-watch app-state :on-change (fn [_ _ _ _] (println "app-state changed!" @app-state)))
  (add-watch app-state :on-change (fn [_ _ _ _] (render!)))
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
