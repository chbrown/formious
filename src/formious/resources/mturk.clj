(ns formious.resources.mturk
  (:require [formious.mturk :as mturk]
            [formious.db.aws-account :as AWSAccount]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [defaults]]))

; POST /api/mturk/GetAccountBalance?aws_account_id=number&environment=production|sandbox
; The querystring should contain the aws_account id and the target MTurk environment.
; aws_account_id indicates a record in the AWS Account table, which contains the
; AWS Access Key ID and AWS Secret Access Key

(defresource mturk defaults
  ; :available-media-types ["text/xml"]
  :allowed-methods [:post]
  :post! (fn [ctx]
           (let [{:keys [query-params]} (:request ctx)
                 {:strs [aws_account_id environment]} query-params
                 ; :operation comes from the bidi request-params
                 Operation (:operation ctx)
                 {:keys [access_key_id secret_access_key]} (AWSAccount/find-by-id aws_account_id)
                 endpoint (-> (keyword environment) mturk/endpoints)]
             (case Operation
               "GetAccountBalance" (mturk/getAccountBalance endpoint access_key_id secret_access_key)
               (str "Not yet implemented: Operation=" Operation)))))
