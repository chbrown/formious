(ns com.formious.routes.api.administrators
  (:require [com.formious.common :refer [no-content created]]
            [com.formious.db.administrator :as Administrator]
            [compojure.core :refer [defroutes]]))

(defroutes routes
  (GET "/" []
    (Administrator/all))
  (GET "/new" []
    (Administrator/empty))

  (POST "/" {{:strings [email, password]} :body}
    (-> (Administrator/create email, password) (created)))
  (GET "/:id" [id :<< as-int]
    (-> (Administrator/find id) (dissoc "password")))
  (POST "/:id" [id :<< as-int :as {{:strings [email, password]} :body}]
    ; TODO: make the password optional and hash it if it is not empty
    (Administrator/updateCredentials id email, password)
    (no-content))
  (DELETE "/:id" [id :<< as-int]
    (Administrator/delete id)
    (no-content))
  ; Administrator <-> AWS Account many2many relationship
  (context "/:administrator_id/aws_accounts" [administrator_id :<< as-int]
    ; List administrator-AWS accounts linked to this administrator
    (GET "/" []
      (AWSAccount/all-by-administrator administrator_id))
    ; Create administrator-AWS account link
    (POST "/:aws_account_id" [aws_account_id :<< as-int :as {{:strings [priority]} :query-params}]
      (-> (AWSAccountAdministrator/create administrator_id, aws_account_id, (Long/parseLong priority))
          (created)))
    ; Delete administrator-AWS account link
    (DELETE "/:aws_account_id" [aws_account_id :<< as-int]
      (AWSAccountAdministrator/delete administrator_id, aws_account_id)
      (no-content))))
