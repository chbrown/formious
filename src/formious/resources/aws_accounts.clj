(ns formious.resources.aws-accounts
  (:require [formious.db.aws-account :as AWSAccount]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [resource-list resource-record]]))

(defresource aws-accounts (resource-list AWSAccount/writable-columns
                                         AWSAccount/all
                                         AWSAccount/insert!))

(defresource aws-account (resource-record AWSAccount/writable-columns
                                          AWSAccount/blank
                                          AWSAccount/find-by-id
                                          AWSAccount/update!
                                          AWSAccount/delete!))

; Administrator <-> AWS Account many2many relationship
; (context "/:administrator_id/aws_accounts" [administrator_id]
;   ; List administrator-AWS accounts linked to this administrator
;   (GET "/" []
;     (-> (AWSAccount/all-by-administrator administrator_id) (ok)))
;   ; Create administrator-AWS account link
;   (POST "/:aws_account_id" [aws_account_id :as {{:strs [priority]} :query-params}]
;     (-> (AWSAccountAdministrator/insert! {:administrator_id administrator_id
;                                           :aws_account_id aws_account_id
;                                           :priority (Long/parseLong priority)})
;         (created)))
;   ; Delete administrator-AWS account link
;   (DELETE "/:aws_account_id" [aws_account_id]
;     (AWSAccountAdministrator/delete! administrator_id aws_account_id)
;     (no-content))))
