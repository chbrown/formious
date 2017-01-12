(ns com.formious.routes.api.mturk
  (:require [com.formious.common :refer [created ]]
            [com.formious.db.aws-account :as AWSAccount]
            [ring.util.response :refer [resource-response not-found]]
            [compojure.core :refer [GET POST defroutes]])
  (:import [com.amazonaws.mturk.util ClientConfig]
           [com.amazonaws.mturk.service.axis RequesterService]))

(defroutes routes
  ;case POST -> Root / "GetAccountBalance" =>
  ; POST /api/mturk/?aws_account_id=number&environment='production'|'sandbox'
  (POST "/" {{:strings [aws_account_id environment]} :query-params
             body :body}
    ; The querystring should contain the aws_account.id and the target MTurk environment.
    ; `aws_account_id` indicates a record in the AWS Account table, which exposes the
    ; AWS Access Key ID and AWS Secret Access Key
    ;
    ; The POST should contain, minimally, an "Operation" field, indicating the MTurk
    ; API operation to call.
    ;retriable_errors=Server.ServiceUnavailable
    ;retry_attempts=10
    ;retry_delay_millis=1000
    (let [SERVICE_URL (if (= environment "sandbox")
                        ClientConfig/SANDBOX_SERVICE_URL
                        ClientConfig.PRODUCTION_SERVICE_URL)
          {:keys [access_key_id secret_access_key]} (AWSAccount/find aws_account_id)
          config (doto (ClientConfig.)
                       (.setServiceURL SERVICE_URL)
                       (.setAccessKeyId access_key_id)
                       (.setSecretAccessKey secret_access_key))
          service (RequesterService. config)]
      (case (get body "Operation")
        "GetAccountBalance" service.getAccountBalance
        ;val hit = service.createHIT(title, description, reward,
        ;  RequesterService.getBasicFreeTextQuestion("What is the weather like right now in Seattle, WA?"), numAssignments)
        (let [xml (str "Not yet implemented: " (str service))] ; connection.post(body)
          (-> xml (response) (header "Content-Type", "text/xml")))))))
