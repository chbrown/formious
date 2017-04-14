(ns formious.routes)

(def ^:private admin-mturk-routes {
  "/" ::admin-mturk
  "/dashboard" ::admin-mturk-dashboard
  "/hits" {"" ::admin-mturk-hits
           "/new" ::admin-mturk-hit-new ; TODO: ensure this gets matched first
           ["/" :HITId] ::admin-mturk-hit}
  "qualification_types" {"" ::admin-mturk-qualification-types
                         "/new" ::admin-mturk-qualification-type-new ; TODO: ensure this gets matched first
                         ["/" :HITId] ::admin-mturk-qualification-type}})

(def ^:private admin-routes {
  "login" ::admin-login
  "access_tokens" {"" ::admin-access-tokens
                   ["/" :access_token_id] ::admin-access-token}
  "administrators" {"" ::admin-administrators
                    ["/" :administrator_id] ::admin-administrator}
  "aws-accounts" {"" ::admin-aws-accounts
                  ["/" :aws_account_id] ::admin-aws-account}
  "experiments" {"" ::admin-experiments
                 ["/" :experiment_id] ::admin-experiment
                 "/blocks" ::admin-blocks
                 ["/blocks/" :block_id] ::admin-block}
  ["mturk/" :environment "/" :aws_account_id] admin-mturk-routes
  "responses" ::admin-responses
  "templates" {"" ::admin-templates
               ["/" :template_id] ::admin-template}})

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
  ; respond to all /admin/* requests with the ui layout html
  "admin" [[true ::layout]] ; ANY
  ; static resources:
  ; #{"favicon.png" "favicon.ico"} (fn [_] ; GET
  ;   (-> "public/favicon.png" resource-response (content-type "image/png")))
  "img/" [[true ::file]]
  "build/" [[true ::file]]
  "formious-globals.js" ::file})

(def routes ["/" base-routes])
