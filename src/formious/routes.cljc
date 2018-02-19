(ns formious.routes
  "This module is primarily a mapping from URL paths to route endpoint
  structures, which are maps like {:endpoint ::ns/kw <:group :kw> <:param1 value1> ...}."
  (:require [clojure.string :as str]
            [formious.util :refer [as-long]]
            [formious.resources :as resources]
            [routes.core :as routes]
            [routes.extra :refer [parameterize]]))

; Oset is a collection of route Patterns that are matched as a set would be,
; but in the order given.
(defrecord Oset [coll]
  routes/Pattern
  (match-pattern [_ m]
    (some #(routes/match-pattern % m) coll))
  (generate-pattern-path [_ m]
    (some #(routes/generate-pattern-path % m) coll)))

(defn- oset
  "Create an Oset instance"
  [& xs]
  (Oset. xs))

(def ^:private resources-routes
  {"accesstokens"   {(oset ["/" :id] "") ::resources/accesstoken}
   "administrators" {(oset ["/" :id] "") ::resources/administrator}
   ["administrators" :administrator_id "awsaccounts"] {(oset ["/" :awsaccount_id] "") ::resources/awsaccount_administrator}
   "awsaccounts"    {(oset ["/" :id] "") ::resources/awsaccount}
   "experiments"    {(oset ["/" :id] "") ::resources/experiment}
   ["experiments/" :experiment_id "/blocks"] {(oset ["/" :id] "") ::resources/block}
   "participants"   {(oset ["/" :id] "") ::resources/participant}
   "responses"      {(oset ["/" :id] "") ::resources/response}
   "templates"      {(oset ["/" :id] "") ::resources/template}})

(def ^:private mturk-routes
  {["mturk/" :environment "/" :awsaccount_id]
   {"/dashboard" ::mturk-dashboard
    "/hits" {(oset ["/" :HITId] "") ::mturk-hit}
    "/qualificationtypes" {(oset ["/" :QualificationTypeId] "") ::mturk-qualificationtype}}})

(def routes
  ["/" {(parameterize "api/" :group :api) resources-routes
        (parameterize "admin/" :group :admin) (merge resources-routes mturk-routes)
        ["experiments/" :id] ::experiment
        ; {:get ::experiment-get-block :post ::experiment-post-block}
        ["experiments/" :experiment_id "/blocks/" :id] ::block
        "login" ::login ; POST
        "mturk/externalSubmit" ::mturk-submit ; POST
        "responses" ::responses ; GET
        "echo" ::echo ; ANY
        "info" ::info ; GET
        "parse-table" ::parse-table ; POST
        ; static resources:
        #{"favicon.png" "favicon.ico"} ::favicon
        "img/" [true ::file]
        "build/" [true ::file]
        "formious-globals.js" ::file
        "" ::root}])

(defn- naturalize
  "Turn s into a Long if it looks like an integer,
  using a RegEx matching positive or negative integer strings."
  [s]
  (cond-> s (re-matches #"[-+]?\d+" s) as-long))

(defn- naturalize-ids
  "Update the map `m` by calling (naturalize v) on the values which have a key ending in 'id'."
  [m]
  (let [id-keys (filter #(str/ends-with? (name %) "id") (keys m))]
    (reduce (fn [m k] (update m k naturalize)) m id-keys)))

(defn resolve-endpoint
  "Same as routes.core/resolve-endpoint with the main routes structure pre-bound.
  Also parses any integer-looking values for keys ending in 'id'."
  [m]
  (naturalize-ids (routes/resolve-endpoint routes m)))

(defn generate-path
  "Same as routes.core/generate-path with the main routes structure pre-bound."
  [params]
  (routes/generate-path routes params))
