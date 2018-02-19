(ns formious.test-db
  (:require [clojure.test :refer [deftest is are testing]]
            [formious.resources :as resources]
            [formious.db :as db]))

(deftest test-administrator-queries
  (is (pos? (-> (db/query-resource ::resources/administrator {}) count))))
