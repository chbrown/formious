(ns formious.routes
  (:require [formious.common :refer [created ok no-content]]
            [formious.db :as db]
            [formious.excel :as excel]
            [formious.csv :as csv]
            [formious.db.administrator :as Administrator]
            [formious.db.participant :as Participant]
            [formious.db.response :as Response]
            [formious.db.access-token :as AccessToken]
            [formious.routes.api :as api]
            [formious.routes.experiments :as experiments]
            [clojure.set :as set]
            [clojure.java.io :as io]
            [clojure.instant :as instant]
            [clojure.string :as string]
            [rum.core :as rum]
            [ring.util.response :refer [response resource-response content-type get-header set-cookie]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE ANY defroutes context]]
            [compojure.route :as route]))

(defn- load-properties
  [resource-path]
  (with-open [reader (-> resource-path io/resource io/reader)]
    (doto (java.util.Properties.)
          (.load reader))))

(defn render-markup
  [component]
  (str "<!DOCTYPE html>" (rum/render-static-markup component)))

(rum/defc layout []
  [:html
    [:head
      [:meta {:charset "UTF-8"}]
      [:title "Formious Admin"]
      [:link {:href "/favicon.png" :rel "icon" :type "image/png"}]
      [:link {:href "/build/site.css" :rel "stylesheet" :type "text/css"}]]
      ; [:script {:dangerouslySetInnerHTML {:__html aws-credentials-js}}]]
    [:body.admin
      [:div {:id "app"}]
      [:script {:src "/build/bundle.js"}]]])

(def layout-html (render-markup (layout)))

(defroutes routes
  (context "/api" [] api/routes)
  (context "/experiments" [] experiments/routes)

  (GET "/responses*"
    {params :query-params}
    (let [{:strs [token experiment_id]} params]
      ;paramOption("accept") :: headerOption("accept")
      ; GET /experiments/:experiment_id/responses?token=ABCDEF12345
      ; Requires authorization, but only by access token.
      ; Show only the responses that reference this Experiment.
      ;paramAcceptOption: Option[String], headerAcceptOption: Option[String]) =>
      ;val accept = paramAcceptOption.orElse(headerAcceptOption).getOrElse("application/json boundary=LF")
      (if-let [access-token (AccessToken/check token "experiments" experiment_id)]
        (do
          ; yay, authorization granted
          (println "authorized experiments /" experiment_id "via token" token)
          (Response/extended-responses experiment_id))
        ; Unauthorized(Challenge("Basic", "Admin Realm")) ; "Invalid access token"
        {:status 403
         :body "You must login first"})))

  (POST "/login" {body :body}
    (let [{:strs [email password]} body]
      ; Try to login as user with email and password
      ; TODO: make artificially slow to deflect brute force attacks
      ; setTimeout(function() { ... }, 500)
      (if-let [access-token (Administrator/authenticate email password)]
        (do
          (println "found access-token" access-token)
          (-> "Authenticated successfully"
              (response)
              (set-cookie "administrator_token" (:token access-token)
                          :path "/"
                          :max-age (* 60 60 24 31)))) ; 31 days in seconds
        ; we serve the login page from GET as well as failed login POSTs
        ; Unauthorized(Challenge("Basic", "Admin Realm"))
        {:status 403
         :body "You must login first"})))

  (POST "/mturk/externalSubmit"
    {params :query-params body :body}
    ; This is a testing filler for the MTurk production / sandbox final POST, which
    ; will point to https://www.mturk.com/mturk/externalSubmit for production HITs,
    ; or https://workersandbox.mturk.com/mturk/externalSubmit for sandbox HITs. The
    ; MTurk ExternalQuestion format automatically adds a `?turkSubmitTo` querystring
    ; parameter to the given URL, but if that's missing, it'll be evaluated as the
    ; empty string, and so missing final post backs will hit this endpoint.
    ; only assignmentId is required
    ; maybe fail on null block_id?
    (let [{:strs [workerId assignmentId block_id] :or {workerId "WORKER_ID_NOT_AVAILABLE" block_id 0}} params
          participant (Participant/find-or-create-by-worker-id workerId nil nil)]
      (Response/insert! {:participant_id (:id participant)
                         :block_id block_id
                         :body body
                         :assignmentId assignmentId})
      (response "Your responses have been submitted and saved.")))

  (ANY "/echo" request
    (-> request (dissoc :async-channel) (ok)))

  (GET "/info" request
    (->> (load-properties "META-INF/maven/formious/app/pom.properties") (into {}) (ok)))

  (ANY "/admin/*" []
    ; respond to all /admin/* requests with /ui/index.html
    (-> "ui/index.html" resource-response (content-type "text/html")))

  (GET "/favicon.png" []
    (-> "public/favicon.png" resource-response (content-type "image/png")))

  (POST "/parse-table" {:keys [headers body]}
    (case (:content-type headers)
     ; Parse csv-like input flexibly and write out json to response
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      (-> body excel/first-sheet-as-maps)
      ; "application/json" parse(body).getOrElse(Json.Null).asArray.get
      ; default: csv
      (-> body io/reader csv/as-maps))) ; Header("Content-Type", "application/json"))

  ; (route/resources "/") ; attempt to load static resource

  (GET "/*" [] ; wildcard match for all GET requests
    (content-type (response layout-html) "text/html"))
  ; /*****************************************************************************
  ; *                               catch-all                                    *
  ; *****************************************************************************/
  (route/not-found "Not Found"))
