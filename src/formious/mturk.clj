(ns formious.mturk
  (:require [clojure.set :as set]
            [http.async.client :as http])
  (:import [java.io InputStream]
           [javax.crypto Mac]
           [javax.crypto.spec SecretKeySpec]))

(def service-host {:sandbox "mechanicalturk.sandbox.amazonaws.com"
                   :production "mechanicalturk.amazonaws.com"})

(def version "2014-08-15")

(def service "AWSMechanicalTurkRequester")

(def signing-algorithm "HmacSHA1")

; "Instances of Base64.Encoder class are safe for use by multiple concurrent threads."
(def ^:private base64Encoder (java.util.Base64/getEncoder))

(defn- sign
  [key data]
  (let [key-spec (SecretKeySpec. (.getBytes key "UTF-8") signing-algorithm)
        mac (doto (Mac/getInstance signing-algorithm)
                  (.init key-spec))
        mac-bytes (.doFinal mac (.getBytes data "UTF-8"))]
    (.encodeToString base64Encoder mac-bytes)))

(defn serialize
  [params]
  (for [[key value] params]
    (condp #(%1 %2) value
      ; &BonusAmount.1.Amount=5
      ; &BonusAmount.1.CurrencyCode=USD
      map? (for [[sub-key sub-value] value]
             {(str key \. \1 \. sub-key) sub-value})
      ; &QualificationRequirement.1.QualificationTypeId=789RVWYBAZW00EXAMPLE
      ; &QualificationRequirement.1.IntegerValue=18
      ; &QualificationRequirement.2.QualificationTypeId=237HSIANVCI00EXAMPLE
      ; &QualificationRequirement.2.IntegerValue=1
      seq? (->> value
                (map-indexed (fn [index item]
                               (for [[sub-key sub-value] item]
                                 {(str key \. index \. sub-key) sub-value})))
                (apply concat))
      ;else if (value.toXML) {
      ;; not sure if this is the best approach. I really doubt it.
      ;; Maybe each possible AWS parameter object should inherit some AWSSerializable interace?
      ;serialized[key] = value.toXML();
      ; ignore undefined values
      nil? ()
      ; &Reason=Thanks%20for%20doing%20great%20work!
      {key value})))

(defn request
  ; the destructured 3rd argument (credentials) matches the column names from the database
  ; http docs: http://cch1.github.io/http.async.client/doc/index.html
  [params host {:keys [access_key_id secret_access_key]}]
  (let [url (str "https://" host "/")
        timestamp (.toString (java.time.Instant/now))
        operation (get params "Operation")
        signature (sign secret_access_key (str service operation timestamp))
        common-params {"AWSAccessKeyId" access_key_id
                       "Service" service
                       "Operation" operation
                       "Signature" signature
                       "Timestamp" timestamp
                       "Version" version}
        form (into {} (serialize (merge common-params params)))]
    (println "Sending form" form)
    (with-open [client (http/create-client)]
      (let [resp (http/GET client url :query form)]
        ; (println "HTTP/status:" (-> resp (http/status)))
        ; (println "HTTP/headers:" (-> resp (http/headers)))
        (http/await resp)
        ; (println (http/string resp))
        (http/string resp)))))
