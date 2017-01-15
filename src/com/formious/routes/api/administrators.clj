(ns com.formious.routes.api.administrators
  (:require [com.formious.common :refer [no-content created ok]]
            [com.formious.db.administrator :as Administrator]
            [com.formious.db.aws-account :as AWSAccount]
            [com.formious.db.aws-account-administrator :as AWSAccountAdministrator]
            [compojure.coercions :refer [as-int]]
            [compojure.core :refer [GET HEAD PATCH POST PUT DELETE defroutes context]]))

(defroutes routes
  (GET "/" []
    (->> (Administrator/all) (map #(dissoc % :password)) (ok)))
  (GET "/new" []
    (-> (Administrator/blank) (ok)))
  (POST "/" {body :body}
    (->> (select-keys body ["email" "password"])
         (Administrator/insert!)
         (created)))
  (GET "/:id" [id :<< as-int]
    (-> (Administrator/find-by-id id) (dissoc :password) (ok)))
  (POST "/:id" [id :<< as-int :as {body :body}]
    ; TODO: make the password optional and hash it if it is not empty
    (->> (select-keys body ["email" "password"])
         (Administrator/update! id))
    (no-content))
  (DELETE "/:id" [id :<< as-int]
    (Administrator/delete! id)
    (no-content))
  ; Administrator <-> AWS Account many2many relationship
  (context "/:administrator_id/aws_accounts" [administrator_id :<< as-int]
    ; List administrator-AWS accounts linked to this administrator
    (GET "/" []
      (-> (AWSAccount/all-by-administrator administrator_id) (ok)))
    ; Create administrator-AWS account link
    (POST "/:aws_account_id" [aws_account_id :<< as-int :as {{:strs [priority]} :query-params}]
      (-> (AWSAccountAdministrator/insert! {:administrator_id administrator_id
                                            :aws_account_id aws_account_id
                                            :priority (Long/parseLong priority)})
          (created)))
    ; Delete administrator-AWS account link
    (DELETE "/:aws_account_id" [aws_account_id :<< as-int]
      (AWSAccountAdministrator/delete! administrator_id aws_account_id)
      (no-content))))
