CREATE TABLE administrators (
  id SERIAL PRIMARY KEY,

  email TEXT UNIQUE NOT NULL,
  -- sha256 hex digest produces 64-character string
  password TEXT NOT NULL CHECK (LENGTH(password) = 64),

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE participants (
  id SERIAL PRIMARY KEY,

  -- support normal participants
  name TEXT,

  -- and AWS workers
  aws_worker_id TEXT,
  aws_bonus_owed NUMERIC DEFAULT 0,
  aws_bonus_paid NUMERIC DEFAULT 0,

  -- browser details
  ip_address TEXT,
  user_agent TEXT,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE access_tokens (
  id SERIAL PRIMARY KEY,

  token TEXT NOT NULL,
  relation TEXT NOT NULL, -- e.g., 'administrators', 'participants', 'experiments', etc.
  foreign_id INTEGER NOT NULL, -- maps to the primary key (id) of the relation denoted above

  expires TIMESTAMP WITH TIME ZONE,
  redacted TIMESTAMP WITH TIME ZONE,
  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL,

  UNIQUE(token, relation)
);
CREATE INDEX access_tokens_token_idx ON access_tokens(token);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,

  name TEXT UNIQUE NOT NULL,
  html TEXT,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE experiments (
  id SERIAL PRIMARY KEY,

  name TEXT,
  -- slug TEXT,
  administrator_id INTEGER REFERENCES administrators(id) ON DELETE CASCADE NOT NULL , -- owner
  html TEXT, -- to be included on every page, at the top of the <body>

  -- `parameters` should match the keys of each stim's `context` object, or most of them
  -- not really necessary, except to impose an ordering
  parameters TEXT[] DEFAULT '{}'::TEXT[],

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

-- `stim` refers to a completely specified stimulus,
-- not just the "type" of stimulus, which is designated by `template`
CREATE TABLE stims (
  id SERIAL PRIMARY KEY,

  experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  context JSON,
  view_order REAL DEFAULT 0 NOT NULL,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);
-- is this index necessary, considering the FK?
-- CREATE INDEX stims_experiment_id_idx ON stims(experiment_id); -- USING btree


CREATE TABLE responses (
  id SERIAL PRIMARY KEY,

  -- there may be multiple respones per stim, so we don't set a unique on (participant_id, stim_id)
  participant_id INTEGER REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  stim_id INTEGER REFERENCES stims(id) ON DELETE CASCADE NOT NULL,
  value JSON,

  -- having an optional assignment_id allows merging the data on mturk into the local database,
  -- while the unique constraint prevents merging duplicates.
  -- this will be NULL for most responses.
  assignment_id TEXT UNIQUE,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

-- how to handle segmentations?
-- // the following are used primarily when the states are determined for a participant
-- // segmenting controls (mostly auto-configured)
-- segmented: {
--   type: Boolean,
--   "default": false,
-- },
-- segments: [String], // set of segment names (from "participant" column in states)
-- segments_claimed: [String], // subset of segment names

-- MTurk should be factored out somehow

CREATE TABLE aws_accounts (
  id SERIAL PRIMARY KEY,

  name TEXT UNIQUE,
  access_key_id TEXT NOT NULL, -- accessKeyId
  secret_access_key TEXT NOT NULL, -- secretAccessKey

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE aws_account_administrators (
  id SERIAL PRIMARY KEY,

  aws_account_id INTEGER REFERENCES aws_accounts(id) ON DELETE CASCADE NOT NULL,
  administrator_id INTEGER REFERENCES administrators(id) ON DELETE CASCADE NOT NULL,
  priority INTEGER,
  -- role ...

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL,

  UNIQUE(aws_account_id, administrator_id) --, role
);
