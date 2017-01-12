(ns com.formious.routes
  (:require [com.formious.db :as db]
            [com.formious.excel :as excel]
            [com.formious.csv :as csv]
            [com.formious.db.administrator :as Administrator]
            [com.formious.db.participant :as Participant]
            [com.formious.db.response :as Response]
            [rum.core :as rum]
            [clojure.instant :as instant]
            [ring.util.response :refer [resource-response content-type get-header set-cookie]]
            [clojure.set :as set]
            [clojure.string :as string]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes]]
            [compojure.route :as route]))

; from olhado/urllib.cljs

; (defn- split-parameter
;   [parameter]
;   (let [[k v] (string/split parameter #"=" 2)]
;     [k v]))

; (defn search->seq
;   "Convert the window.location.search value to a seq of key-value tuples.
;   A completely empty search value returns nil, but a search value of just '?' returns an empty sequence."
;   [search]
;   (if (string/blank? search)
;     nil
;     (map split-parameter (string/split (subs search 1) #"&"))))

; (defn seq->search
;   "Serialize a seq of key-value tuples back into a string"
;   [kvs]
;   (if (empty? kvs)
;     ""
;     (str "?" (string/join "&" (map (fn [[k v]] (str k "=" v)) kvs)))))

; (defn- append-val
;   "Implement defaultdict(list) functionality"
;   [m [k v]]
;   (update m k #(conj (or % []) v)))

; (defn search->map
;   "Run search->seq and collect all values with the same key into a vector"
;   [search]
;   (reduce append-val {} (search->seq search)))

; (defn map->search
;   "Serialize a map of name-vector tuples back into a string"
;   [m]
;   ; unpack (flatten) each name-vector into a vector of name-item pairs
;   (seq->search (mapcat (fn [[name values]] (for [value values] [name value])) m)))


; (get action-body "started") is a string, which JDBC doesn't like
; (defn revive-action [action]
;   (-> action
;       (update-some "started" instant/read-instant-timestamp)
;       (update-some "ended" instant/read-instant-timestamp)))

(defn render-markup
  [component]
  (str "<!DOCTYPE html>" (rum/render-static-markup component)))

; TODO: figure out why (assoc-in site-defaults [:params :keywordize] true) in core.clj doesn't work

(defroutes routes
  ; (GET "/posts" [req]
  ;   (let [query-limit (get-in req [:query-params :limit] "10")
  ;         limit (min 100 (Long/parseLong query-limit))
  ;         posts (db/fetchPosts {:limit limit})]
  ;     (render-markup (views/Public posts))
  ;     ; posts
  ;     ))

  (context "/api" [] api/routes)
  (context "/experiments" [] experiments/routes)

  (GET "/responses*"
    {params :query-params}
    (let [{:strings [token experiment_id]} params]
      ;paramOption("accept") :: headerOption("accept")
      ; GET /experiments/:experiment_id/responses?token=ABCDEF12345
      ; Requires authorization, but only by access token.
      ; Show only the responses that reference this Experiment.
      ;paramAcceptOption: Option[String], headerAcceptOption: Option[String]) =>
      ;val accept = paramAcceptOption.orElse(headerAcceptOption).getOrElse("application/json boundary=LF")
      (if-let [access-token (access-token/check token, "experiments", experiment_id)]
        (do
          ; yay, authorization granted
          (println "authorized experiments /" experiment_id "via token" token)
          (response/extended-responses experiment_id))
        ; Unauthorized(Challenge("Basic", "Admin Realm")) ; "Invalid access token"
        {:status 403
         :body "You must login first"})))

  (POST "/login" {body :body}
    (let [{:strings [email password]} body]
      ; Try to login as user with email and password
      ; TODO: make artificially slow to deflect brute force attacks
      ; setTimeout(function() { ... }, 500)
      (if-let [access-token (administrator/authenticate email password)]
        (do
          (println "found access-token" access-token)
          (-> "Authenticated successfully"
              response
              (set "administrator_token" (:token access-token) :path "/"
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
      (let [{:strings [workerId assignmentId block_id] :or {workerId "WORKER_ID_NOT_AVAILABLE" block_id 0}} params
            participant (participant/find-or-create-by-worker-id workerId nil nil)]
        (response/create participant.id, block_id, body, assignmentId)
        (response "Your responses have been submitted and saved.")))

  (ANY "/echo" request
    ; case class RequestInfo(httpVersion: String, method: String, uri: String, headers: Map[String, String], remoteAddress: String)
    ; val httpVersion = request.httpVersion.toString
    ; val method = request.method.toString
    ; val remoteAddr = request.remoteAddr.getOrElse("").toString
    ; val headers = request.headers.map { header => header.name.toString -> header.value }.toMap
    ; val payload = RequestInfo(httpVersion, method, request.uri.toString, headers, remoteAddr)
    request)

  (GET "/info" request
    ; case class ProjectInfo(organization: String, name: String, version: String, scalaVersion: String, libraryDependencies: Seq[String])
    ; val payload = ProjectInfo(BuildInfo.organization, BuildInfo.name,
    ;   BuildInfo.version, BuildInfo.scalaVersion, BuildInfo.libraryDependencies)
    {:message "Not yet implemented. Sry."})

  (ANY "/admin/*"
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

  (route/resources "/") ; attempt to load static resource
  ; (GET "/*" [] ; wildcard match for all GET requests
  ;   (content-type (resource-response "public/index.html") "text/html"))
  ; /*****************************************************************************
  ; *                               catch-all                                    *
  ; *****************************************************************************/
  (route/not-found "Not Found"))
