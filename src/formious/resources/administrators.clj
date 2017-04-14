(ns formious.resources.administrators
  (:require [formious.db.administrator :as Administrator]
            [formious.db.aws-account :as AWSAccount]
            [formious.db.aws-account-administrator :as AWSAccountAdministrator]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [resource-list resource-record]]))

(defresource administrators (resource-list Administrator/writable-columns
                                           Administrator/all
                                           Administrator/insert!)
  :handle-ok (map #(dissoc % :password) (Administrator/all)))

(defresource administrator (resource-record Administrator/writable-columns
                                            Administrator/blank
                                            Administrator/find-by-id
                                            Administrator/update!
                                            Administrator/delete!)
  ; TODO: make the password optional and hash it if it is not empty
  :handle-ok (fn [ctx] (dissoc (:record ctx) :password)))
