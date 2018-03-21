(ns formious.db.accesstoken
  (:require [formious.util :refer [as-long random-string]]
            [formious.db :as db]))

(defn query
  [params]
  (db/query "SELECT * FROM accesstoken ORDER BY id ASC"))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM accesstoken WHERE id = ?" (as-long id)])))

(defn all
  []
  (db/query "SELECT * FROM accesstoken ORDER BY id ASC"))

(defn insert!
  ; row keys: ^String token ^String relation ^Integer foreign_id expires redacted
  [row]
  (db/insert! "accesstoken" row))

(defn- insert-random!
  [relation foreign_id {:keys [length expires redacted]
                        :or   {length 40}}]
  {:pre [(string? relation) (integer? foreign_id)]}
  (insert! {:token (random-string length)
            :relation relation
            :foreign_id foreign_id
            :expires expires
            :redacted redacted}))

(defn find-or-create!
  "Find or create an accesstoken with the specified access.

  * `relation` is a table name.
  * `foreign_id` is a pointer to the `id` column on the table denoted by the `relation` field.
  * `length` and `expires` are only used if a new accesstoken is created.

  TODO: convert to proper upsert."
  [relation foreign_id length expires]
  (if-let [row (first (db/query ["SELECT * FROM accesstoken
                                  WHERE relation = ?
                                    AND foreign_id = ?
                                    AND (expires IS NULL OR expires > NOW())
                                    AND redacted IS NULL" relation (as-long foreign_id)]))]
    row
    (insert! {:token (random-string length)
              :relation relation
              :foreign_id (as-long foreign_id)})))

(defn update!
  [id set-map]
  ; reject if set-map has any unrecognized keys
  {:pre [(empty? (dissoc set-map :token :relation :foreign_id :expires :redacted))]}
  (db/update! "accesstoken" set-map ["id = ?" (as-long id)]))

(defn check
  ; TODO: generalize this for use in find-or-create! (which doesn't use the token)
  [token relation foreign_id]
  (first (db/query ["SELECT * FROM accesstoken
                     WHERE token = ?
                       AND relation = ?
                       AND foreign_id = ?
                       AND (expires IS NULL OR expires > NOW())
                       AND redacted IS NULL" token relation (as-long foreign_id)])))

(defn find-by-id
  [id]
  (first (db/query ["SELECT * FROM accesstoken WHERE id = ?" (as-long id)])))
