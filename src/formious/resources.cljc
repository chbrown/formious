(ns formious.resources
  "Metadata for keywords indicating RESTful resources")

(def all
  ; TODO: replace with (keys metadata) maybe?
  #{::accesstoken
    ::administrator
    ::awsaccount
    ::awsaccount_administrator
    ::block
    ::experiment
    ::participant
    ::response
    ::template})

(def metadata
  "This is used by formious.resources.sql/select, a.o.,
  to include/exclude specific columns from certain sensitive resources types."
  {::accesstoken
   {:pk-columns [:id]
    :writable-columns [:token
                       :relation
                       :foreign_id
                       :expires
                       :redacted]
    :blank {:id "new"
            :token ""
            :relation ""
            :foreign_id 0}}
   ::administrator
   {:pk-columns [:id]
    :writable-columns [:email
                       :password]
    :readable-columns [:id :email :created]
    :blank {:id "new"
            :email ""
            :password ""}}
   ::awsaccount
   {:pk-columns [:id]
    :writable-columns [:name
                       :access_key_id
                       :secret_access_key]
    :blank {:id "new"
            :name ""
            :access_key_id ""
            :secret_access_key ""}}
   ::awsaccount_administrator
   {:pk-columns [:awsaccount_id :administrator_id]
    :writable-columns [:awsaccount_id
                       :administrator_id
                       :priority]
    :blank {:id "new"
            :awsaccount_id ""
            :administrator_id ""
            ; priority is optional
            :priority 0}}
   ::block
   {:pk-columns [:id :experiment_id]
    :writable-columns [:template_id
                       :context
                       :view_order
                       :randomize
                       :parent_block_id
                       :quota]
    :blank {:id nil
            :experiment_id nil
            :template_id nil
            :context "{}"
            :view_order 0
            :randomize false
            :parent_block_id nil
            :quota nil}}
   ::experiment
   {:pk-columns [:id]
    :writable-columns [:name
                       :administrator_id
                       :html]
    :blank {:id "new"
            :name ""
            :administrator_id nil
            :html ""}}
   ::participant
   {:pk-columns [:id]
    :writable-columns [:name
                       :aws_worker_id
                       :aws_bonus_owed
                       :aws_bonus_paid
                       :ip_address
                       :user_agent]}
   ::response
   {:pk-columns [:id]
    :writable-columns [:participant_id
                       :block_id
                       :data
                       :assignment_id]}
   ::template
   {:pk-columns [:id]
    :writable-columns [:name
                       :html]
    :blank {:id "new"
            :name ""
            :html ""}}})

(defn resource-keyword?
  "Check that `resource`:
  1. is a keyword
  2. has the namespace `formious.resources`
  3. is one of the listed resources in `formious.resources/all`"
  [resource]
  (and (keyword? resource)
       (= (namespace resource) "formious.resources")
       (contains? all resource)))

(defn table
  "Return the keyword form of the name of `resource`
  (which must pass `resource-keyword?`)"
  [resource]
  {:pre [(resource-keyword? resource)]}
  (keyword (name resource)))
