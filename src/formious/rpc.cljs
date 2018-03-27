(ns formious.rpc
  "Platform-dependent (dispatch! action) handlers, for ClojureScript."
  (:require [clojure.core.async :refer [<! go]]
            [cljs-http.client :as http]
            [formious.store :refer [app-state dispatch!]]
            [formious.resources :as resources]
            [formious.util :refer [keyed as-sequential elide]]
            [formious.routes :as routes :refer [generate-path]]))

(defn- api-url
  "Generate the /api/:resource/... path/URL for the given `resource` and `params`"
  [resource params]
  (generate-path (assoc params :group :api :endpoint resource)))

(defn- add-action-error!
  "Add to :errors sequence in app-state"
  [action response]
  (let [error (ex-info (str "Failed to handle " (:type action) " action")
                       {:action action :response response})]
    (swap! app-state update :errors conj error)))

(defmethod dispatch! :select
  [{:keys [resource where-params] :as action}]
  (go (let [{:keys [body success] :as response} (<! (http/get (api-url resource where-params) :query-params where-params))]
        (if success
          ; body might be a seq, or it might be a single map - so we ensure it's a seq
          (swap! app-state update resource merge (keyed :id (as-sequential body)))
          (add-action-error! action response)))))

(defmethod dispatch! :insert!
  [{:keys [resource value-params] :as action}]
  (go (let [{:keys [body success] :as response} (<! (http/post (api-url resource value-params) :form-params value-params))]
        (if success
          (swap! app-state update resource merge (keyed :id (list body)))
          (add-action-error! action response)))))

(defmethod dispatch! :update!
  [{:keys [resource set-params where-params] :as action}]
  (go (let [{:keys [body success] :as response} (<! (http/put (api-url resource where-params) :form-params set-params))]
        (if success
          (swap! app-state update resource merge (keyed :id (list body)))
          (add-action-error! action response)))))

(defmethod dispatch! :delete!
  [{:keys [resource where-params] :as action}]
  (go (let [{:keys [body success] :as response} (<! (http/delete (api-url resource where-params)))]
        (if success
          ; immediately delete corresponding resource from app-state on success
          (swap! app-state update resource dissoc (:id where-params))
          ; otherwise, add to :errors seq in app-state
          (add-action-error! action response)))))

(defmethod dispatch! :login!
  [{:keys [email password]}]
  (println `dispatch! `:login! "email:" email "password:" password)
  (go (let [response (<! (http/post "/login" {:form-params {:email email
                                                            :password password}}))
            {:keys [message] :as body} (:body response)]
        (println `login! "received response" response "with body" body "and message" message)
        (println "TODO: redirect to originally desired page")
        (println "TODO: store auth token if we got one back?")
        nil)))

(defmethod dispatch! :logout!
  [action]
  ; Delete the authentication cookie (docs: https://google.github.io/closure-library/api/goog.net.Cookies.html)
  (.remove goog.net.cookies "administrator_token" "/")
  (println "Deleted administrator_token cookie")
  ; Return to the login page
  (let [login-route {:endpoint ::routes/login}
        login-path (routes/generate-path login-route)]
    (js/history.pushState nil login-path)
    (swap! app-state assoc :route login-route)))
