(ns formious.test-util
  (:require [clojure.test :as test :refer [deftest is are testing]]
            [formious.util :refer [update-when update-in-when assoc-in-when
                                   unique-keys
                                   map-values map-keys
                                   elide
                                   keyed
                                   pluralize]]))

(deftest test-update-when
  (is (= {:a 1} (update-when {:a 1} :b inc)))
  (is (= {:a 2} (update-when {:a 1} :a inc))))

(deftest test-update-in-when
  (is (= {:a 1} (update-in-when {:a 1} [:b] inc)))
  (is (= {:a {:b 2}} (update-in-when {:a {:b 1}} [:a :b] inc))))

(deftest test-assoc-in-when
  (is (= {:a 1} (assoc-in-when {:a 1} [:b] 2)))
  (is (= {:a {:b 2}} (assoc-in-when {:a {:b 1}} [:a :b] 2))))

(deftest test-unique-keys
  (is (= [:a] (unique-keys [{:a 1} {:a 2}])))
  (is (= [:a :b] (unique-keys [{:a 1} {:a 2 :b 2}]))))

(deftest test-map-values
  (is (= {:a 2} (map-values inc {:a 1}))))

(deftest test-map-keys
  (is (= {"a" 1} (map-keys name {:a 1}))))

(deftest test-elide
  (is (= "wx…" (elide "wxyz" 3)))
  (is (= "wxy" (elide "wxy" 3))))

(deftest test-keyed
  (is (= {1 {:id 1}} (keyed :id [{:id 1}]))))

(deftest test-pluralize
  (is (= "x" (pluralize "x" [1])))
  (is (= "xs" (pluralize "x" [1 2]))))
