(ns com.formious.routes.api.mturk
  (:require [com.formious.common :refer [created]]
            [com.formious.mturk :as mturk]
            [com.formious.db.aws-account :as AWSAccount]
            [ring.util.response :refer [response not-found header]]
            [compojure.core :refer [GET POST defroutes]]))

(defroutes routes
  ;(POST "/GetAccountBalance" [] ...)
  ; POST /api/mturk/?aws_account_id=number&environment='production'|'sandbox'
  ; The querystring should contain the aws_account id and the target MTurk environment.
  ; aws_account_id indicates a record in the AWS Account table, which contains the
  ; AWS Access Key ID and AWS Secret Access Key
  (POST "/" {{:strs [aws_account_id environment]} :query-params
             {:strs [Operation] :as body} :body}
    (let [credentials (AWSAccount/find-by-id aws_account_id)
          host (-> (keyword environment) mturk/service-host)]
      (-> (case Operation
            "GetAccountBalance" (mturk/request body host credentials)
            ; val hit = service.createHIT(title description reward
            ;   RequesterService.getBasicFreeTextQuestion("What is the weather like right now in Seattle, WA?"), numAssignments)
            (str "Not yet implemented: Operation=" Operation))
          (response)
          (header "Content-Type" "text/xml")))))
