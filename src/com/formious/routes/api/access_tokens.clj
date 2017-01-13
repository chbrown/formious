(ns com.formious.routes.api.access-tokens
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.access-token :as AccessToken]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes context]]))

(defroutes routes
  (GET "/" [] ; List all access tokens
    (AccessToken/all))
  (GET "/new" [] ; Generate blank access token
    (AccessToken/blank))
  (POST "/" {{:strs [token relation foreign_id expires redacted]} :body} ; Create new access token
    (-> (AccessToken/insert! token relation foreign_id expires redacted) (created)))
  (GET "/:id" [id :<< as-int] ; Show existing access token
    (AccessToken/find-by-id id))
  (POST "/:id" [id :<< as-int :as {{:strs [id token relation foreign_id expires redacted]} :body}] ; Update existing access token
    (AccessToken/update! id token relation foreign_id expires redacted)
    (no-content))
  (DELETE "/:id" [id :<< as-int] ; Delete existing access token
    (AccessToken/delete! id)
    (no-content)))
