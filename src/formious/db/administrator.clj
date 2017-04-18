(ns formious.db.administrator
  (:require [formious.common :refer [update-when now ->long]]
            [clojure.tools.logging :as log]
            [formious.db.access-token :as AccessToken]
            [formious.db.common :as db]))

(def ^:private SALT "rNxROdgCbAkBI2WvZJtH")

(defn- hash-with-salt
  "take a string s, add salt, hash with SHA-256 and return output as hex digest string"
  [s]
  (let [message (doto (java.security.MessageDigest/getInstance "SHA-256")
                      (.update (.getBytes ^String SALT "UTF-8"))
                      (.update (.getBytes ^String s "UTF-8")))
        message-bytes (.digest message)]
    (javax.xml.bind.DatatypeConverter/printHexBinary message-bytes)))

; Int String String ZonedDateTime
(defrecord Administrator [id email password created])
(def writable-columns ["email" "password"])

(defn blank
  []
  (Administrator. 0 "" "" (now)))

(defn all
  []
  (->> (db/query "SELECT * FROM administrator ORDER BY created DESC")
       (map map->Administrator)))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM administrator WHERE id = ?" id])
          first
          map->Administrator))

(defn delete!
  [id]
  (db/delete! "administrator" ["id = ?" id]))

(defn insert!
  [row]
  (->> (update-when row :password hash-with-salt)
       (db/insert! "administrator")
       map->Administrator))

(defn update!
  ; Hashes and sets the password if it is not None
  [id set-map]
  (db/update! "administrator" (update-when set-map :password hash-with-salt) ["id = ?" id]))

(defn authenticate
  [email password]
  (when-let [administrator (first (db/query ["SELECT * FROM administrator
                                              WHERE email = ? AND password = ?" email (hash-with-salt password)]))]
    (log/debug "Authenticating administrator" (:id administrator) "with new or existing token")
    (AccessToken/find-or-create! "administrators" (:id administrator) 40 nil)))

; Get administrator object from token.
; @return None if no access token matched or if no administrator is linked to that token

(defn from-token
  [token]
  (when-let [access-token (db/query ["SELECT * FROM access_token
                                      WHERE token = ?
                                        AND relation = 'administrators'
                                        AND (expires IS NULL OR expires > NOW())" token])]
    (log/debug "Authenticating administrator for token" (:token access-token))
    (find-by-id (-> access-token first :foreign_id))))
