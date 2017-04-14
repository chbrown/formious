(ns formious.resources.access-tokens
  (:require [formious.db.access-token :as AccessToken]
            [liberator.core :refer [defresource]]
            [formious.resources.rest :refer [resource-list resource-record]]))

(defresource access-tokens (resource-list AccessToken/writable-columns
                                          AccessToken/all
                                          AccessToken/insert!))

(defresource access-token (resource-record AccessToken/writable-columns
                                           AccessToken/blank
                                           AccessToken/find-by-id
                                           AccessToken/update!
                                           AccessToken/delete!))
