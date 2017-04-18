(ns formious.server.mturk
  (:require [clojure.set :as set]
            [formious.common :refer [map-kv]]
            [http.async.client :as http])
  (:import (java.io InputStream)
           (com.amazonaws.client.builder AwsClientBuilder$EndpointConfiguration)
           (com.amazonaws.auth BasicAWSCredentials
                               AWSStaticCredentialsProvider
                               DefaultAWSCredentialsProviderChain)
           (com.amazonaws.services.mturk AmazonMTurk AmazonMTurkClientBuilder)
           (com.amazonaws.services.mturk.model GetAccountBalanceRequest)
           (javax.crypto Mac)
           (javax.crypto.spec SecretKeySpec)))

(def endpoints {:sandbox "mturk-requester-sandbox.us-east-1.amazonaws.com"
                :production "mturk-requester.us-east-1.amazonaws.com"})

; Examples https://github.com/awslabs/mturk-code-samples/tree/master/Java

(defn ^AmazonMTurk create-client
  ([endpoint credentials-provider]
   (-> (AmazonMTurkClientBuilder/standard)
       (.withEndpointConfiguration (AwsClientBuilder$EndpointConfiguration. endpoint "us-east-1"))
       (.withCredentials credentials-provider)
       (.build)))
  ([endpoint access-key secret-key]
   (create-client endpoint (AWSStaticCredentialsProvider. (BasicAWSCredentials. access-key secret-key))))
  ([endpoint]
   (create-client endpoint (DefaultAWSCredentialsProviderChain.))))

(defn getAccountBalance
  [endpoint access-key secret-key]
  (-> (create-client endpoint access-key secret-key)
      (.getAccountBalance (GetAccountBalanceRequest.))
      (.getAvailableBalance)))

; val hit = service.createHIT(title description reward
;   RequesterService.getBasicFreeTextQuestion("What is the weather like right now in Seattle, WA?"), numAssignments)

; (def clients (map-kv create-client endpoints))

; (def service-host {:sandbox "mechanicalturk.sandbox.amazonaws.com"
;                    :production "mechanicalturk.amazonaws.com"})

; credentials = Aws::Credentials.new(aws_access_key_id, aws_secret_access_key)
; mturk = Aws::MTurk::Client.new(endpoint: endpoint, credentials: credentials)

; # This will return $10,000.00 in the MTurk Developer Sandbox
; puts mturk.get_account_balance[:available_balance]

; 2017–01–17
; (def version "2014-08-15")
; (def service "AWSMechanicalTurkRequester")
; (def signing-algorithm "HmacSHA1")

; "Instances of Base64.Encoder class are safe for use by multiple concurrent threads."
; (def ^:private base64Encoder (java.util.Base64/getEncoder))

; (defn- sign
;   [key data]
;   (let [key-spec (SecretKeySpec. (.getBytes key "UTF-8") signing-algorithm)
;         mac (doto (Mac/getInstance signing-algorithm)
;                   (.init key-spec))
;         mac-bytes (.doFinal mac (.getBytes data "UTF-8"))]
;     (.encodeToString base64Encoder mac-bytes)))

; (defn serialize
;   [params]
;   (for [[key value] params]
;     (condp #(%1 %2) value
;       ; &BonusAmount.1.Amount=5
;       ; &BonusAmount.1.CurrencyCode=USD
;       map? (for [[sub-key sub-value] value]
;              {(str key \. \1 \. sub-key) sub-value})
;       ; &QualificationRequirement.1.QualificationTypeId=789RVWYBAZW00EXAMPLE
;       ; &QualificationRequirement.1.IntegerValue=18
;       ; &QualificationRequirement.2.QualificationTypeId=237HSIANVCI00EXAMPLE
;       ; &QualificationRequirement.2.IntegerValue=1
;       seq? (->> value
;                 (map-indexed (fn [index item]
;                                (for [[sub-key sub-value] item]
;                                  {(str key \. index \. sub-key) sub-value})))
;                 (apply concat))
;       ;else if (value.toXML) {
;       ;; not sure if this is the best approach. I really doubt it.
;       ;; Maybe each possible AWS parameter object should inherit some AWSSerializable interace?
;       ;serialized[key] = value.toXML();
;       ; ignore undefined values
;       nil? ()
;       ; &Reason=Thanks%20for%20doing%20great%20work!
;       {key value})))

; (defn request
;   ; the destructured 3rd argument (credentials) matches the column names from the database
;   ; http docs: http://cch1.github.io/http.async.client/doc/index.html
;   [params host {:keys [access_key_id secret_access_key]}]
;   (let [url (str "https://" host "/")
;         timestamp (.toString (java.time.Instant/now))
;         operation (get params "Operation")
;         signature (sign secret_access_key (str service operation timestamp))
;         common-params {"AWSAccessKeyId" access_key_id
;                        "Service" service
;                        "Operation" operation
;                        "Signature" signature
;                        "Timestamp" timestamp
;                        "Version" version}
;         form (into {} (serialize (merge common-params params)))]
;     (println "Sending form" form)
;     (with-open [client (http/create-client)]
;       (let [resp (http/GET client url :query form)]
;         ; (println "HTTP/status:" (-> resp (http/status)))
;         ; (println "HTTP/headers:" (-> resp (http/headers)))
;         (http/await resp)
;         ; (println (http/string resp))
;         (http/string resp)))))
