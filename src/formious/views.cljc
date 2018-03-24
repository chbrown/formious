(ns formious.views
  (:require [rum.core :as rum]
            [formious.util :refer [write-transit-str]]
            [formious.routes :as routes :refer [generate-path]]
            [formious.resources :as resources]
            [formious.store :refer [app-state]]
            [formious.views.common :refer [event-value]]
            ; resource-specific views
            [formious.views.accesstokens :as accesstokens]
            [formious.views.administrators :as administrators]
            [formious.views.awsaccounts :as awsaccounts]
            [formious.views.blocks :as blocks]
            [formious.views.experiments :as experiments]
            [formious.views.hits :as hits]
            [formious.views.mturk :as mturk]
            [formious.views.participants :as participants]
            [formious.views.qualificationtypes :as qualificationtypes]
            [formious.views.responses :as responses]
            [formious.views.templates :as templates]
            #?(:cljs [goog.net.cookies])))

(rum/defc not-found
  [path]
  [:div
   [:h3 "Not Found!"]
   [:p "Could not find route for path:"]
   [:code.hpad path]
   [:p
    [:a {:href "javascript:back"} "back"]]])

(defn- login
  [email password]
  ; (js/fetch "/login" {:email email :password password})
  ; .then(function(res) {$state.go($state.params.to) return res.data.message},
  ;       function(res) {return res.data.message}))
  ; NotifyUI.addPromise(promise)
  (println "TODO: actually login" email password))

(rum/defcs admin-login < (rum/local 0 ::email)
                         (rum/local 0 ::password)
  [state]
  [:div
   [:div.shadow {:style {:width "200px"
                         :margin "80px auto"
                         :background-color "white"}}
    [:form {:on-submit (fn [_] (login @(::email state) @(::password state)))
            :style {:padding "10px"}}
     [:h3 "Admin Login"]
     [:label
      [:div "Email"]
      [:input {:on-change #(swap! (::email state) (event-value %))
               :style {:width "100%"}}]]
     [:label
      [:div "Password"]
      [:input {:ng-model #(swap! (::password state) (event-value %))
               :type "password"
               :style {:width "100%"}}]]
     [:p
      [:button "Login"]]]]])

(rum/defc AdminPage
  [children]
  [:html
   [:head
    [:meta {:charset "UTF-8"}]
    [:title "Formious Admin"]
    [:link {:href "/favicon.png" :rel "icon" :type "image/png"}]
    [:link {:href "/build/site.css" :rel "stylesheet" :type "text/css"}]]
   [:body.admin
    [:div {:id "app"} children]
    [:script {:id "ssr_store"
              :type "application/transit+json"
              :dangerouslySetInnerHTML {:__html (write-transit-str @app-state)}}]
    [:script {:src "/build/bundle.js"}]]])

(defn logout
  [& [event]]
  ; NotifyUI.add('Deleted administrator token')
  ; $state.go('.', {}, {reload: true})
  ; https://google.github.io/closure-library/api/goog.net.Cookies.html
  #?(:clj nil
     :cljs (.remove goog.net.cookies "administrator_token" "/")))

(rum/defc AppLayout
  [children]
  [:div
   ; (FixedFlow ...)
   [:nav.fixedflow
    [:a.tab {:href (generate-path {:group :admin :endpoint ::resources/awsaccount})} "AWS Accounts"]
    [:a.tab {:href (generate-path {:group :admin :endpoint ::resources/mturk})} "MTurk"]
    [:a.tab {:href (generate-path {:group :admin :endpoint ::resources/administrator})} "Administrators"]
    [:a.tab {:href (generate-path {:group :admin :endpoint ::resources/experiment})} "Experiments"]
    [:a.tab {:href (generate-path {:group :admin :endpoint ::resources/template})} "Templates"]
    [:a.tab {:href (generate-path {:group :admin :endpoint ::resources/response})} "Responses"]
    [:div {:style {:float "right"}}
     [:button.anchor.tab {:on-click logout} "Logout"]]]
   children])

(def endpoint-mapping
  "Mapping from resource-endpoint -> route-keyset -> view list"
  {; resources
   ::resources/accesstoken   {#{}    [accesstokens/accesstokens]
                              #{:id} [accesstokens/accesstoken]}
   ::resources/administrator {#{}    [administrators/layout administrators/administrators]
                              #{:id} [administrators/layout administrators/administrator]}
   ::resources/awsaccount    {#{}    [awsaccounts/layout awsaccounts/awsaccounts]
                              #{:id} [awsaccounts/layout awsaccounts/awsaccount]}
   ::resources/block         {#{:experiment_id}     [blocks/blocks]
                              #{:experiment_id :id} [blocks/block]}
   ::resources/experiment    {#{}    [experiments/layout experiments/experiments]
                              #{:id} [experiments/layout experiments/experiment]}
   ::resources/response      {#{}    [responses/responses]}
   ::resources/template      {#{}    [templates/layout templates/templates]
                              #{:id} [templates/layout templates/template]}
   ; other routes that have views
   ::routes/login            {#{}    [admin-login]}})
