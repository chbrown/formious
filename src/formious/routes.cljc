(ns formious.routes)

(def ^:private admin-mturk-routes {
  "" ::admin-mturk
  "/dashboard" ::admin-mturk-dashboard
  "/hits" {"" ::admin-mturk-hits
           "/new" ::admin-mturk-hit-new ; TODO: ensure this gets matched first
           ["/" :HITId] ::admin-mturk-hit}
  "/qualification-types" {"" ::admin-mturk-qualification-types
                          "/new" ::admin-mturk-qualification-type-new ; TODO: ensure this gets matched first
                          ["/" :HITId] ::admin-mturk-qualification-type}})

(def ^:private admin-routes {
  "login" ::admin-login
  "access-tokens" {"" ::admin-access-tokens
                   ["/" :id] ::admin-access-token}
  "administrators" {"" ::admin-administrators
                    ["/" :id] ::admin-administrator}
  "aws-accounts" {"" ::admin-aws-accounts
                  ["/" :id] ::admin-aws-account}
  "experiments" {"" ::admin-experiments
                 ["/" :id] ::admin-experiment
                 ["/" :experiment-id "/blocks"] {"" ::admin-blocks
                                                 ["/" :id] ::admin-block}}
  ["mturk/" :environment "/" :aws-account-id] admin-mturk-routes
  "responses" ::admin-responses
  "templates" {"" ::admin-templates
               ["/" :id] ::admin-template}})

(def ^:private api-routes {
  "access-tokens"  {"" ::api-access-tokens
                    ["/" :id] ::api-access-token}
  "administrators" {"" ::api-administrators
                    ["/" :id] ::api-administrator}
  "aws-accounts"   {"" ::api-aws-accounts
                    ["/" :id] ::api-aws-account}
  "experiments"    {"" ::api-experiments
                    ["/" :id] ::api-experiment
                    ["/" :experiment-id "/blocks"] {"" ::api-blocks
                                                    "/tree" ::api-block-tree
                                                    ["/" :id] ::api-block}}
  "responses"      {"" ::api-responses
                    ["/" :id] ::api-response}
  "templates"      {"" ::api-templates
                    ["/" :id] ::api-template}
  ["mturk/" :operation] ::api-mturk})

(def ^:private experiment-routes {
  "" ::experiment
  ["blocks/" :block-id] {:get ::experiment-get-block
                         :post ::experiment-post-block}})

(def ^:private base-routes {
  "api/" api-routes
  "admin/" admin-routes
  ["experiments/" :id] experiment-routes
  "login" ::login ; POST
  "mturk/externalSubmit" ::mturk-submit ; POST
  "responses" ::responses ; GET
  "echo" ::echo ; ANY
  "info" ::info ; GET
  "parse-table" ::parse-table ; POST
  ; static resources:
  #{"favicon.png" "favicon.ico"} ::favicon
  "img/" [[true ::file]]
  "build/" [[true ::file]]
  "formious-globals.js" ::file})

(def routes ["/" base-routes])
