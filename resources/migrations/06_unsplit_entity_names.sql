-- tables
ALTER TABLE access_token              RENAME TO accesstoken;
ALTER TABLE aws_account_administrator RENAME TO awsaccount_administrator;
ALTER TABLE aws_account               RENAME TO awsaccount;

-- columns
ALTER TABLE awsaccount_administrator
  RENAME COLUMN aws_account_id TO awsaccount_id;
