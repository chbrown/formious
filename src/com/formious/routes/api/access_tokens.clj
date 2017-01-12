(ns com.formious.routes.api.access-tokens
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.access-token :as AccessToken]
            [compojure.core :refer [defroutes]]))

(defroutes routes
  (GET "/" [] ; List all access tokens
    (AccessToken/all))
  (GET "/new" [] ; Generate blank access token
    (AccessToken/empty))
  (POST "/" {{:strings [token, relation, foreign_id, expires, redacted]} :body} ; Create new access token
    (-> (AccessToken/create token, relation, foreign_id, expires, redacted) (created)))
  (GET "/:id" [id :<< as-int] ; Show existing access token
    (AccessTokens/find id))
  (POST "/:id" [id :<< as-int :as {{:strings [id, token, relation, foreign_id, expires, redacted]} :body}] ; Update existing access token
    (AccessToken/update id, token, relation, foreign_id, expires, redacted)
    (no-content))
  (DELETE "/:id" [id :<< as-int] ; Delete existing access token
    (AccessToken/delete id)
    (no-content)))
