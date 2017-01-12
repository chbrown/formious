(ns com.formious.routes.api.aws-accounts
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.aws-account :as AWSAccount]
            [ring.util.response :refer [resource-response content-type header]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes]]))

(defroutes routes
  (GET "/" []
    (AWSAccount/all))
  (GET "/new" []
    (AWSAccount/blank))
  (POST "/" {{:strings [name, access_key_id, secret_access_key]} :body}
    (-> (AWSAccount/create name, access_key_id, secret_access_key) (created)))
  (GET "/:id" [id :<< as-int]
    (AWSAccount/find-by-id id))
  (POST "/:id" [id :<< as-int :as {{:strings [name, access_key_id, secret_access_key]} :body}]
    (AWSAccount/update id name, access_key_id, secret_access_key)
    (no-content))
  (DELETE "/:id" [id :<< as-int]
    (AWSAccount/delete id)
    (no-content)))
