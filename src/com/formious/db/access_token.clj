(ns com.formious.db.access-token
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

(def ^:private ALPHABET "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")

(defn- random-string
  "return alphaDecimal of given length"
  [^Int length]
  (repeatedly length #(rand-nth ALPHABET)))


(defrecord AccessToken [^Int id
                        ^String token
                        ^String relation
                        ^Int foreign_id
                        ^ZonedDateTime expires
                        ^ZonedDateTime redacted
                        ^ZonedDateTime created])

(defn row->AccessToken
  [{:keys [id token relation foreign_id expires redacted created]}]
  (Template. id token relation foreign_id
             (some-> expires .toZonedDateTime)
             (some-> redacted .toZonedDateTime)
             (.toZonedDateTime created)))

(defn blank
  []
  (AccessToken. 0, "", "", 0, nil, nil, (ZonedDateTime/now)))

(defn all
  []
  (->> (db/query "SELECT * FROM access_token ORDER BY id ASC")
       (map row->AccessToken)))

(defn insert!
  ; row keys: ^String token ^String relation ^Int foreign_id expires redacted
  [row]
  (-> (db/insert! "access_token" row) row->AccessToken))

(defn- createRandom
  [^String relation ^Int foreign_id {:keys [length expires redacted] :or {length 40}}]
  (create (random-string length), relation, foreign_id, expires, redacted))

(defn find-or-create
  ; TODO: convert to upsert
  ; @param relation   A table name
  ; @param foreign_id Pointer to the "id" column on the table denoted by the "relation" field
  [relation foreign_id length expires]
  (if-let [row (first (db/query ["SELECT * FROM access_token
                                  WHERE relation = ?
                                    AND foreign_id = ?
                                    AND (expires IS NULL OR expires > NOW())
                                    AND redacted IS NULL" relation, foreign_id]))]
    (row->AccessToken row)
    (insert! (random-string length), relation, foreign_id)))

(defn update!
  ; row keys: token, relation, foreign_id, expires, redacted
  [id set-map]
  (db/update! "access_token" set-map ["id = ?" id]))

(defn check
  ; TODO: generalize this for use in find-or-create (which doesn't use the token)
  [token relation foreign_id]
  (-> (db/query ["SELECT * FROM access_token
                  WHERE token = ?
                    AND relation = ?
                    AND foreign_id = ?
                    AND (expires IS NULL OR expires > NOW())
                    AND redacted IS NULL" token, relation, foreign_id])
      first
      row->AccessToken))

(defn find-by-id
  [id]
  (-> (db/query ["SELECT * FROM access_token WHERE id = ?", id])
      first
      row->AccessToken))

(defn delete!
  [id]
  (db/delete! "access_token" ["id = ?", id]))
