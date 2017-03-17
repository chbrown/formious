(ns formious.db.administrator
  (:require [formious.db :as db]
            [formious.db.access-token :as AccessToken]
            [formious.common :as common])
  (:import [java.time ZonedDateTime]))

(def ^:private SALT "rNxROdgCbAkBI2WvZJtH")

(defn- hash-with-salt
  "take a string s, add salt, hash with SHA-256 and return output as hex digest string"
  [s]
  (let [message (doto (java.security.MessageDigest/getInstance "SHA-256")
                      (.update (.getBytes SALT "UTF-8"))
                      (.update (.getBytes s "UTF-8")))
        message-bytes (.digest message)]
    (javax.xml.bind.DatatypeConverter/printHexBinary message-bytes)))

; Int String String ZonedDateTime
(defrecord Administrator [id email password created])

(defn blank
  []
  (Administrator. 0 "" "" (ZonedDateTime/now)))

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
  (->> (common/update-when row :password hash-with-salt)
       (db/insert! "administrator")
       map->Administrator))

(defn update!
  ; Hashes and sets the password if it is not None
  [id set-map]
  (db/update! "administrator" (common/update-when set-map :password hash-with-salt) ["id = ?" id]))

(defn authenticate
  [email password]
  (if-let [administrator (first (db/query ["SELECT * FROM administrator
                                            WHERE email = ? AND password = ?" email (hash-with-salt password)]))]
    ; (println s"Authenticating administrator '${administrator.id}' and with new or existing token")
    (AccessToken/find-or-create "administrators" (:id administrator) 40 nil)))

; Get administrator object from token.
; @return None if no access token matched or if no administrator is linked to that token

(defn from-token
  [token]
  (when-let [access-token (db/query ["SELECT * FROM access_token
                                      WHERE token = ?
                                        AND relation = 'administrators'
                                        AND (expires IS NULL OR expires > NOW())" token])]
    ; logger.debug(s"Authenticating administrator for token '${accessToken.token}'")
    (find-by-id (-> access-token first :foreign_id))))
