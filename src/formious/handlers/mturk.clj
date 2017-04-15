(ns formious.handlers.mturk
  (:require [formious.mturk :as mturk]
            [formious.db.aws-account :as AWSAccount]))

; POST /api/mturk/GetAccountBalance?aws_account_id=number&environment=production|sandbox
; The querystring should contain the aws_account id and the target MTurk environment.
; aws_account_id indicates a record in the AWS Account table, which contains the
; AWS Access Key ID and AWS Secret Access Key

(defn post
  [request]
  (let [{:keys [request-params query-params]} request
        {:strs [aws_account_id environment]} query-params
        {:keys [operation]} request-params
        {:keys [access_key_id secret_access_key]} (AWSAccount/find-by-id aws_account_id)
        endpoint (-> (keyword environment) mturk/endpoints)]
    (case operation
      "GetAccountBalance" (mturk/getAccountBalance endpoint access_key_id secret_access_key)
      (str "Not yet implemented: operation" operation))))
