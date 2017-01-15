(ns com.formious.db.access-token
  (:require [com.formious.db :as db])
  (:import [java.time ZonedDateTime]))

(def ^:private ALPHABET "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")

(defn- random-string
  "return alphaDecimal of given length"
  [^Integer length]
  (repeatedly length #(rand-nth ALPHABET)))

(defrecord AccessToken [^Integer id
                        ^String token
                        ^String relation
                        ^Integer foreign_id
                        ^ZonedDateTime expires
                        ^ZonedDateTime redacted
                        ^ZonedDateTime created])

(defn blank
  []
  (AccessToken. 0 "" "" 0 nil nil (ZonedDateTime/now)))

(defn all
  []
  (->> (db/query "SELECT * FROM access_token ORDER BY id ASC")
       (map map->AccessToken)))

(defn insert!
  ; row keys: ^String token ^String relation ^Integer foreign_id expires redacted
  [row]
  (-> (db/insert! "access_token" row) map->AccessToken))

(defn- createRandom
  [^String relation ^Integer foreign_id {:keys [length expires redacted] :or {length 40}}]
  (insert! {:token (random-string length)
            :relation relation
            :foreign_id foreign_id
            :expires expires
            :redacted redacted}))

(defn find-or-create
  ; TODO: convert to upsert
  ; @param relation   A table name
  ; @param foreign_id Pointer to the "id" column on the table denoted by the "relation" field
  [relation foreign_id length expires]
  (if-let [row (first (db/query ["SELECT * FROM access_token
                                  WHERE relation = ?
                                    AND foreign_id = ?
                                    AND (expires IS NULL OR expires > NOW())
                                    AND redacted IS NULL" relation foreign_id]))]
    (map->AccessToken row)
    (insert! {:token (random-string length)
              :relation relation
              :foreign_id foreign_id})))

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
                    AND redacted IS NULL" token relation foreign_id])
      first
      map->AccessToken))

(defn find-by-id
  [id]
  (-> (db/query ["SELECT * FROM access_token WHERE id = ?" id])
      first
      map->AccessToken))

(defn delete!
  [id]
  (db/delete! "access_token" ["id = ?" id]))
