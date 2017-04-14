(ns formious.handlers.root
  (:require [formious.db.access-token :as AccessToken]
            [formious.db.administrator :as Administrator]
            [formious.db.participant :as Participant]
            [formious.db.response :as Response]
            [formious.excel :as excel]
            [formious.csv :as csv]
            [clojure.data.json :as json]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [rum.core :as rum]
            [formious.views.common :refer [render-page admin-layout-html]]
            [ring.util.request :refer [content-type]]
            [ring.util.response :as response :refer [response set-cookie]]))

(defn echo
  "Return information about the (ring) request as a hash-map"
  [request]
  (-> request
      (dissoc :async-channel)
      (response)))

(defn login
  "Try to login as user with email and password
  TODO: make artificially slow to deflect brute force attacks
  E.g., setTimeout(function() { ... }, 500)"
  [request]
  (let [{:strs [email password]} (:body request)]
    (if-let [access-token (Administrator/authenticate email password)]
      (do
        (log/info "found access-token" access-token)
        (-> "Authenticated successfully"
            (response)
            (set-cookie "administrator_token" (:token access-token)
                        :path "/"
                        :max-age (* 60 60 24 31)))) ; 31 days in seconds
      ; we serve the login page from GET as well as failed login POSTs
      {:status 403
       :body "You must login first"})))

(defn parse-table
  "Parse tabular input flexibly and write out json to response"
  ; Header("Content-Type", "application/json"))
  [request]
  (case (content-type request)
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      (-> request :body excel/first-sheet-as-maps)
    "application/json"
      (-> request :body (json/read-str :key-fn keyword) seq)
    ; default: csv
    (-> request :body io/reader csv/as-maps)))

(defn mturk-submit
  "This is a testing filler for the MTurk production / sandbox final POST, which
  will point to https://www.mturk.com/mturk/externalSubmit for production HITs,
  or https://workersandbox.mturk.com/mturk/externalSubmit for sandbox HITs. The
  MTurk ExternalQuestion format automatically adds a `?turkSubmitTo` querystring
  parameter to the given URL, but if that's missing, it'll be evaluated as the
  empty string, and so missing final post backs will hit this endpoint.
  only assignmentId is required
  maybe fail on null block_id?"
  [request]
  (let [{:keys [query-params body]} request
        {:strs [workerId assignmentId block_id]
           :or {workerId "WORKER_ID_NOT_AVAILABLE"
                block_id 0}} query-params
        participant (Participant/find-or-create-by-worker-id! workerId nil nil)]
    (Response/insert! {:participant_id (:id participant)
                       :block_id block_id
                       :body body
                       :assignmentId assignmentId})
    (response "Your responses have been submitted and saved.")))

(defn export-responses
  "GET /responses/responses?token=ABCDEF12345&experiment_id=123
  Requires authorization, but only by access token.
  Show only the responses that reference this Experiment."
  ; TODO: move this into "responses" resource
  [request]
  (let [{:strs [token experiment_id]} (:query-params request)]
    ;paramOption("accept") :: headerOption("accept")
    ;paramAcceptOption: Option[String], headerAcceptOption: Option[String]) =>
    ;val accept = paramAcceptOption.orElse(headerAcceptOption).getOrElse("application/json boundary=LF")
    (if-let [access-token (AccessToken/check token "experiments" experiment_id)]
      (do
        ; yay, authorization granted
        (log/info "authorized experiments /" experiment_id "via token" token)
        (Response/extended-responses experiment_id))
      ; "Invalid access token"
      {:status 403
       :body "You must login first"})))

(defn generate-layout
  [request]
  (-> (response admin-layout-html)
      (response/content-type "text/html")))

(defn catch-all
  [request]
  ; (not-found "Not Found")
  (log/warn "executing catch-all route")
  (generate-layout request))
