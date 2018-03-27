(ns formious.views
  (:require [rum.core :as rum]
            [formious.util :refer [write-transit-str]]
            [formious.routes :as routes :refer [generate-path]]
            [formious.resources :as resources]
            [formious.store :refer [app-state dispatch!]]
            [formious.actions :as actions]
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

(rum/defcs admin-login < (rum/local {:email    ""
                                     :password ""} ::login-params)
  [state]
  (let [*login-params (::login-params state)
        {:keys [email password]} @*login-params]
    [:div
     [:div.shadow {:style {:width "200px"
                           :margin "80px auto"
                           :background-color "white"}}
      [:form.hpad.vpad {:method "POST"
                        :action (generate-path {:endpoint ::routes/login})
                        :on-submit #(dispatch! (actions/login! email password))}
       [:h3 "Admin Login"]
       [:label
        [:div "Email"]
        [:input {:on-change #(swap! *login-params assoc :email (event-value %))
                 :style {:width "100%"}}]]
       [:label
        [:div "Password"]
        [:input {:ng-model #(swap! *login-params assoc :password (event-value %))
                 :type "password"
                 :style {:width "100%"}}]]
       [:p
        [:button "Login"]]]]]))

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
     [:button.anchor.tab {:on-click #(dispatch! (actions/logout!))} "Logout"]]]
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
