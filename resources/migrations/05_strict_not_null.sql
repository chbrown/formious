UPDATE aws_account_administrator SET priority = 0 WHERE priority IS NULL;
ALTER TABLE aws_account_administrator
  ALTER COLUMN priority SET DEFAULT 0,
  ALTER COLUMN priority SET NOT NULL;

UPDATE aws_account SET name = 'Not available' WHERE name IS NULL;
ALTER TABLE aws_account ALTER COLUMN name SET NOT NULL;

UPDATE block SET context = '{}'::JSON WHERE context IS NULL;
ALTER TABLE block
  ALTER COLUMN context SET DATA TYPE JSONB,
  ALTER COLUMN context SET DEFAULT '{}'::JSONB,
  ALTER COLUMN context SET NOT NULL;

UPDATE experiment SET name = 'Not available' WHERE name IS NULL;
ALTER TABLE experiment ALTER COLUMN name SET NOT NULL;

UPDATE experiment SET html = '' WHERE html IS NULL;
ALTER TABLE experiment ALTER COLUMN html SET NOT NULL;

UPDATE template SET html = '' WHERE html IS NULL;
ALTER TABLE template ALTER COLUMN html SET NOT NULL;

ALTER TABLE participant
  ALTER COLUMN aws_bonus_owed SET NOT NULL,
  ALTER COLUMN aws_bonus_paid SET NOT NULL;

ALTER TABLE response RENAME COLUMN value TO data;
UPDATE response SET data = '{}'::JSON WHERE data IS NULL;
ALTER TABLE response
  ALTER COLUMN data SET DATA TYPE JSONB,
  ALTER COLUMN data SET DEFAULT '{}'::JSONB,
  ALTER COLUMN data SET NOT NULL;
