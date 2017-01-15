(ns com.formious.routes.api.access-tokens
  (:require [com.formious.common :refer [no-content created ok]]
            [com.formious.db.access-token :as AccessToken]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes context]]))

(defroutes routes
  (GET "/" [] ; List all access tokens
    (-> (AccessToken/all) (ok)))
  (GET "/new" [] ; Generate blank access token
    (-> (AccessToken/blank) (ok)))
  (POST "/" {body :body} ; Create new access token
    (->> (select-keys body ["token" "relation" "foreign_id" "expires" "redacted"])
         (AccessToken/insert!)
         (created)))
  (GET "/:id" [id :<< as-int] ; Show existing access token
    (-> (AccessToken/find-by-id id) (ok)))
  (POST "/:id" [id :<< as-int :as {body :body}] ; Update existing access token
    (->> (select-keys body ["token" "relation" "foreign_id" "expires" "redacted"])
         (AccessToken/update! id))
    (no-content))
  (DELETE "/:id" [id :<< as-int] ; Delete existing access token
    (AccessToken/delete! id)
    (no-content)))
