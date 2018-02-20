(ns formious.client
  (:require [clojure.string :as str]
            [era.core :as era]
            [formious.resources :as resources]
            [formious.util :refer [read-transit-str]]
            [formious.store :refer [app-state]]
            [formious.routes :as routes :refer [resolve-endpoint generate-path]]
            [formious.views :as views]
            [formious.client.api :as api]
            [rum.core :as rum]))

(enable-console-print!)

(defn full-location
  "Returns the current full location of the window"
  []
  (str js/window.location.pathname js/window.location.search))

(def *route (rum/cursor app-state :route))

(defonce root-element (js/document.getElementById "app"))

(defn find-component
  [endpoint route-params]
  (let [route-keyset (-> route-params (dissoc :group) keys set)
        components (get-in views/endpoint-mapping [endpoint route-keyset])
        component-fn (apply comp views/AppLayout components)]
    ; fetch-resource! has a (async) side-effect of updating the app-state atom
    (api/fetch-resource! endpoint route-params)
    (component-fn)))

(defn render!
  "Main attachment point; calls rum/hydrate"
  []
  (let [{:keys [endpoint] :as route} @*route
        route-params (dissoc route :endpoint)]
    (println "finding root-component for endpoint" endpoint "with route-params" route-params)
    (-> (if endpoint
          (find-component endpoint route-params)
          (views/not-found (full-location)))
        (rum/hydrate root-element))))

(defn- any-modKey?
  "Returns true if the given KeyEvent is flagged for alt/ctrl/meta(=super)/shift key state"
  [event]
  (or (.-altKey event) (.-ctrlKey event) (.-metaKey event) (.-shiftKey event)))

(defn document-click
  "Listener for all document clicks that filters out all non-inbound/in-app link clicks"
  [e]
  (let [el (.-target e)
        href (.getAttribute el "href")
        path (.-pathname el)
        route (resolve-endpoint {:path path})]
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
      (swap! app-state assoc :route route)
      (.preventDefault e))))

(defn route-watch-fn
  [key reference old-state new-state]
  (println "route-watch-fn triggered, calling render!" key old-state new-state)
  (render!))

(defn load-ssr-store!
  []
  (when-let [ssr-store-str (some-> (js/document.getElementById "ssr_store") (.-textContent))]
    (let [store (read-transit-str ssr-store-str)]
      (println "Setting app-state to store from global with keys:" (keys store))
      (swap! app-state merge store))))

(defn init! []
  (println "init!")
  (load-ssr-store!)
  ; if load-ssr-store! fails we would need to fill in the route:
  ; (reset! *route (resolve-endpoint {:path (full-location)}))
  ; (set-location! (full-location))
  (js/document.addEventListener "click" document-click)
  (js/window.addEventListener "popstate" (fn [ev]
                                           (println "popstate" ev "full-location" (full-location))
                                           (let [route (resolve-endpoint {:path (full-location)})]
                                             (reset! *route route))))
  ; > The watch fn must be a fn of 4 args: a key, the reference, its old-state, its new-state
  (add-watch *route :on-change route-watch-fn)
  (render!))

(defn figwheel-on-jsload!
  []
  (println "figwheel-on-jsload!")
  (render!))

(js/document.addEventListener "DOMContentLoaded" init!)

(comment
  (routes/generate-path {:endpoint ::routes/login})
  (routes/resolve-endpoint {:path "/login"}))

; (defn loadExperiments
;   []
;   {:experiments Experiment.query()
;    :administrators Administrator.query()})

; .controller('admin.experiments.edit', function($scope, $state, $localStorage,
;     Experiment, Template, Administrator) {
;   $scope.$storage = $localStorage.$default({expand_experiment_html: false});
;   var experiment = $scope.experiment = Experiment.get({id: $state.params.experiment_id});
;   // $scope.awsaccounts = AWSAccount.query();
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

; $scope.accesstokens = AccessToken.query();
; $scope.delete = function(index) {
;   var promise = $scope.accesstokens[index].$delete().then(function() {
;     $scope.accesstokens.splice(index, 1);
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
;   $scope.awsaccounts = AWSAccount.query();
;   $scope.awsaccount_administrators = AWSAccountAdministrator.query({administrator_id: administrator_id});
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
;     $scope.awsaccount_administrators = AWSAccountAdministrator.query({administrator_id: administrator_id});
;   });
; }
