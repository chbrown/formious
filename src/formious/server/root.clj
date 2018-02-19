(ns formious.server.root
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [clojure.data.json :as json]
            [formious.db.accesstoken :as AccessToken]
            [formious.db.administrator :as Administrator]
            [formious.db.participant :as Participant]
            [formious.db.response :as Response]
            [rum.core :as rum]
            [ring.util.mime-type :refer [ext-mime-type]]
            [ring.util.request :as request :refer [path-info]]
            [ring.util.response :as response :refer [not-found response resource-response]]))

(defn- content-type-if-known
  "Add a Content-Type header to response if a mime type can be inferred from path"
  [response path]
  (if-let [mime-type (ext-mime-type path)]
    (response/content-type response mime-type)
    response))

(defn echo
  "Return information about the (ring) request as a hash-map"
  [request]
  (-> request
      (dissoc :async-channel)
      (response)))

(defn favicon
  [_]
  (-> (resource-response "public/favicon.png")
      (response/content-type "image/png")))

(defn file
  [request]
  (let [path (path-info request)]
    (or (some-> (resource-response path {:root "public"})
                (content-type-if-known path))
        (not-found path))))

(defn- resource->Properties
  "Load the given resource as a Properties instance"
  [resource-name]
  (with-open [reader (-> resource-name io/resource io/reader)]
    (doto (java.util.Properties.)
          (.load reader))))

(defn info
  "Load and return a hash-map representation of the project's POM properties.
  I'm not sure why Figwheel doesn't put target/classes/ on the classpath,
  but this doesn't work when served by Figwheel."
  [request]
  (->> (resource->Properties "META-INF/maven/formious/formious/pom.properties")
       (into {})
       (response)))

(defn login
  "Try to login as user with email and password
  TODO: make artificially slow to deflect brute force attacks
  E.g., setTimeout(function() { ... }, 500)"
  [request]
  (let [{:strs [email password]} (:body request)]
    (if-let [accesstoken (Administrator/authenticate email password)]
      (do
        (log/info "found accesstoken" accesstoken "for email" email "with password (not shown)")
        (assoc (response "Authenticated successfully") :session (:token accesstoken)))
      ; we serve the login page from GET as well as failed login POSTs
      (-> "You must login first"
          (response)
          (response/status 403)))))

(defn mturk-submit
  "This is a test stub for the MTurk production / sandbox final POST, which
  will point to https://www.mturk.com/mturk/externalSubmit for production HITs,
  or https://workersandbox.mturk.com/mturk/externalSubmit for sandbox HITs. The
  MTurk ExternalQuestion format automatically adds a `?turkSubmitTo=` querystring
  parameter to the given URL, but if that's missing, it'll be evaluated as the
  empty string, and so missing final post backs will hit this endpoint.
  only assignmentId is required
  maybe fail on null block_id?"
  [request]
  (let [{:keys [query-params body]} request
        {:strs [workerId assignmentId block_id]
         :or   {workerId "WORKER_ID_NOT_AVAILABLE"
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
    (if-let [accesstoken (AccessToken/check token "experiments" experiment_id)]
      (do
        ; yay, authorization granted
        (log/info "authorized experiments /" experiment_id "via token" token)
        (Response/extended-responses experiment_id))
      ; "Invalid access token"
      {:status 403
       :body "You must login first"})))

(defn- right-align
  "Repeat chr (a single character) to left-pad value (after converting to a string) to at least length characters long.
  Effectively returns (str value) if that's as long or longer than length."
  [chr width value]
  (let [string (str value)
        pad-width (- width (count string))]
    (str (str/join (repeat pad-width chr)) string)))

(defn- kv-lines
  "Format each key-value pair in the map `m` as rows in a table layout,
  the keys right-aligned (left-padded) such that there is a gutter
  consisting of a single space between each [key value] pair."
  [m]
  {:pre [(map? m)]}
  (let [key-max-length (apply max (map (comp count str) (keys m)))]
    (for [[k v] m]
      (str (right-align \space key-max-length k) " " (pr-str v)))))

(defn catch-all
  [request]
  (log/warn "executing catch-all route")
  (let [header-line (str "No route registered for request with uri: " (pr-str (:uri request)))
        request-lines (kv-lines (dissoc request :async-channel))
        message (str/join \newline (cons header-line request-lines))]
    (not-found message)))
