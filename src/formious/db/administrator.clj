(ns formious.db.administrator
  (:require [formious.util :refer [as-long update-when]]
            [clojure.tools.logging :as log]
            [formious.db.accesstoken :as accesstoken]
            [formious.db :as db]))

(defn- hash-with-salt
  "Take a string, add salt, hash with SHA-256 and return output as hex digest string"
  ([unsalted-string]
   (hash-with-salt unsalted-string "rNxROdgCbAkBI2WvZJtH"))
  ([unsalted-string salt]
   {:pre [(some? unsalted-string)]}
   (let [message (doto (java.security.MessageDigest/getInstance "SHA-256")
                       (.update (.getBytes ^String salt "UTF-8"))
                       (.update (.getBytes ^String unsalted-string "UTF-8")))
         message-bytes (.digest message)]
     (javax.xml.bind.DatatypeConverter/printHexBinary message-bytes))))

(defn all
  []
  (db/query "SELECT * FROM administrator ORDER BY created DESC"))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM administrator WHERE id = ?" (as-long id)])))

(defn insert!
  "Hashes and sets the password if it is present"
  [row]
  (db/insert! "administrator" (update-when row :password hash-with-salt)))

(defn update!
  "Hashes and sets the password if it is present"
  [id set-map]
  (db/update! "administrator" (update-when set-map :password hash-with-salt) ["id = ?" (as-long id)]))

(defn authenticate
  [email password]
  (when (and (some? email) (some? password))
    (when-let [administrator (first (db/query ["SELECT * FROM administrator
                                                WHERE email = ? AND password = ?" email (hash-with-salt password)]))]
      (log/debug "Authenticating administrator" (:id administrator) "with new or existing token")
      (accesstoken/find-or-create! "administrators" (:id administrator) 40 nil))))

(defn from-token
  "Get administrator object from token.
  return nil if no access token matched or if no administrator is linked to that token"
  [token]
  (when-let [accesstoken (db/query ["SELECT * FROM accesstoken
                                      WHERE token = ?
                                        AND relation = 'administrators'
                                        AND (expires IS NULL OR expires > NOW())" token])]
    (log/debug "Authenticating administrator for token" (:token accesstoken))
    (find-by-id (-> accesstoken first :foreign_id))))
