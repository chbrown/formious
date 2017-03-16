(ns formious.routes.api.aws-accounts
  (:require [formious.common :refer [no-content created]]
            [formious.db.aws-account :as AWSAccount]
            [ring.util.response :refer [content-type header]]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes]]))

(defroutes routes
  (GET "/" []
    (AWSAccount/all))
  (GET "/new" []
    (AWSAccount/blank))
  (POST "/" {body :body}
    (->> (select-keys body ["name" "access_key_id" "secret_access_key"])
         (AWSAccount/insert!)
         (created)))
  (GET "/:id" [id :<< as-int]
    (AWSAccount/find-by-id id))
  (POST "/:id" [id :<< as-int :as {body :body}]
    (->> (select-keys body ["name" "access_key_id" "secret_access_key"])
         (AWSAccount/update! id))
    (no-content))
  (DELETE "/:id" [id :<< as-int]
    (AWSAccount/delete! id)
    (no-content)))
