(ns com.formious.routes.api.administrators
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.administrator :as Administrator]
            [com.formious.db.aws-account :as AWSAccount]
            [com.formious.db.aws-account-administrator :as AWSAccountAdministrator]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes context]]))

(defroutes routes
  (GET "/" []
    (Administrator/all))
  (GET "/new" []
    (Administrator/blank))

  (POST "/" {{:strs [email password]} :body}
    (-> (Administrator/insert! email password) (created)))
  (GET "/:id" [id :<< as-int]
    (-> (Administrator/find-by-id id) (dissoc "password")))
  (POST "/:id" [id :<< as-int :as {{:strs [email password]} :body}]
    ; TODO: make the password optional and hash it if it is not empty
    (Administrator/update! id email password)
    (no-content))
  (DELETE "/:id" [id :<< as-int]
    (Administrator/delete! id)
    (no-content))
  ; Administrator <-> AWS Account many2many relationship
  (context "/:administrator_id/aws_accounts" [administrator_id :<< as-int]
    ; List administrator-AWS accounts linked to this administrator
    (GET "/" []
      (AWSAccount/all-by-administrator administrator_id))
    ; Create administrator-AWS account link
    (POST "/:aws_account_id" [aws_account_id :<< as-int :as {{:strs [priority]} :query-params}]
      (-> (AWSAccountAdministrator/insert! administrator_id aws_account_id (Long/parseLong priority))
          (created)))
    ; Delete administrator-AWS account link
    (DELETE "/:aws_account_id" [aws_account_id :<< as-int]
      (AWSAccountAdministrator/delete! administrator_id aws_account_id)
      (no-content))))
