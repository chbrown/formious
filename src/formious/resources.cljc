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
   {:writable-columns [:token
                       :relation
                       :foreign_id
                       :expires
                       :redacted]
    :blank {:id "new"
            :token ""
            :relation ""
            :foreign_id 0}}
   ::administrator
   {:writable-columns [:email
                       :password]
    :readable-columns [:id :email :created]
    :blank {:id "new"
            :email ""
            :password ""}}
   ::awsaccount
   {:writable-columns [:name
                       :access_key_id
                       :secret_access_key]
    :blank {:id "new"
            :name ""
            :access_key_id ""
            :secret_access_key ""}}
   ::awsaccount_administrator
   {:writable-columns [:awsaccount_id
                       :administrator_id
                       :priority]
    :blank {:id "new"
            :awsaccount_id ""
            :administrator_id ""
            ; priority is optional
            :priority 0}}
   ::block
   {:writable-columns [:template_id
                       :context
                       :view_order
                       :randomize
                       :parent_block_id
                       :quota]
    :block {:id nil
            :experiment_id nil
            :template_id nil
            :context "{}"
            :view_order 0
            :randomize false
            :parent_block_id nil
            :quota nil}}
   ::experiment
   {:writable-columns [:name
                       :administrator_id
                       :html]
    :blank {:id "new"
            :name ""
            :administrator_id nil
            :html ""}}
   ::participant
   {:writable-columns [:name
                       :aws_worker_id
                       :aws_bonus_owed
                       :aws_bonus_paid
                       :ip_address
                       :user_agent]}
   ::response
   {:writable-columns [:participant_id
                       :block_id
                       :data
                       :assignment_id]}
   ::template
   {:writable-columns [:name
                       :html]
    :blank {:id "new"
            :name ""
            :html ""}}})
