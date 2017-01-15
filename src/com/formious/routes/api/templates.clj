(ns com.formious.routes.api.templates
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.template :as Template]
            [ring.util.response :refer [content-type header]]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes]]))

; /api/templates/*
(defroutes routes
  ; List all templates
  (GET "/" []
    (Template/all))
  ; Generate blank template
  (GET "/new" []
    (Template/blank))
  ; Create new template
  (POST "/" {body :body}
    ; if (err.message && err.message.match(/duplicate key value violates unique constraint/)) {
    ;   ; 303 is a "See other" and SHOULD include a Location header
    ;   return res.status(303).die('Template already exists')
    ; }
    (->> (select-keys body ["name" "html"])
         (Template/insert!)
         (created)))
  ; Show existing template
  (GET "/:id" [id :<< as-int]
    (-> (Template/find-by-id id) (header "Cache-Control", "max-age=5")))
  ; Update existing template
  (POST "/:id" [id :<< as-int :as {body :body}]
    (->> (select-keys body ["name" "html"])
         (Template/update! id))
    (no-content))
  ; Delete existing template
  (DELETE "/:id" [id :<< as-int]
    (Template/delete! id)
    (no-content)))
