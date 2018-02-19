(ns formious.db.accesstoken
  (:require [era.core :refer [now]]
            [formious.util :refer [as-long random-string]]
            [formious.db :as db]))

; ^Integer ^String ^String ^Integer ^ZonedDateTime ^ZonedDateTime ^ZonedDateTime
(defrecord AccessToken [id token relation foreign_id expires redacted created])
(def writable-columns
  ["token"
   "relation"
   "foreign_id"
   "expires"
   "redacted"])

(defn query
  [params]
  (->> (db/query "SELECT * FROM accesstoken ORDER BY id ASC")
       (map map->AccessToken)))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM accesstoken WHERE id = ?" (as-long id)])
          first
          map->AccessToken))

(defn blank
  []
  (AccessToken. "new" "" "" 0 nil nil (now)))

(defn all
  []
  (->> (db/query "SELECT * FROM accesstoken ORDER BY id ASC")
       (map map->AccessToken)))

(defn insert!
  ; row keys: ^String token ^String relation ^Integer foreign_id expires redacted
  [row]
  (-> (db/insert! "accesstoken" row) map->AccessToken))

(defn- createRandom
  [^String relation ^Integer foreign_id {:keys [length expires redacted] :or {length 40}}]
  (insert! {:token (random-string length)
            :relation relation
            :foreign_id foreign_id
            :expires expires
            :redacted redacted}))

(defn find-or-create!
  ; TODO: convert to upsert
  ; @param relation   A table name
  ; @param foreign_id Pointer to the "id" column on the table denoted by the "relation" field
  [relation foreign_id length expires]
  (if-let [row (first (db/query ["SELECT * FROM accesstoken
                                  WHERE relation = ?
                                    AND foreign_id = ?
                                    AND (expires IS NULL OR expires > NOW())
                                    AND redacted IS NULL" relation (as-long foreign_id)]))]
    (map->AccessToken row)
    (insert! {:token (random-string length)
              :relation relation
              :foreign_id (as-long foreign_id)})))

(defn update!
  ; row keys: token, relation, foreign_id, expires, redacted
  [id set-map]
  (db/update! "accesstoken" set-map ["id = ?" (as-long id)]))

(defn check
  ; TODO: generalize this for use in find-or-create! (which doesn't use the token)
  [token relation foreign_id]
  (-> (db/query ["SELECT * FROM accesstoken
                  WHERE token = ?
                    AND relation = ?
                    AND foreign_id = ?
                    AND (expires IS NULL OR expires > NOW())
                    AND redacted IS NULL" token relation (as-long foreign_id)])
      first
      map->AccessToken))

(defn find-by-id
  [id]
  (some-> (db/query ["SELECT * FROM accesstoken WHERE id = ?" (as-long id)])
          first
          map->AccessToken))

(defn delete!
  [id]
  (db/delete! "accesstoken" ["id = ?" (as-long id)]))
