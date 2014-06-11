CREATE TABLE administrators (
  id serial PRIMARY KEY,

  email text UNIQUE NOT NULL,
  -- sha256 hex digest produces 64-character string
  password text NOT NULL CHECK (length(password) = 64),

  created timestamp with time zone DEFAULT current_timestamp NOT NULL
);

CREATE TABLE participants (
  id serial PRIMARY KEY,

  -- support normal participants
  name text,

  -- and AWS workers
  aws_worker_id text,
  aws_bonus_owed numeric DEFAULT 0,
  aws_bonus_paid numeric DEFAULT 0,

  -- browser details
  ip_address text,
  user_agent text,

  created timestamp with time zone DEFAULT current_timestamp NOT NULL
);

CREATE TABLE access_tokens (
  id serial PRIMARY KEY,

  token text NOT NULL,
  relation text NOT NULL, -- e.g., 'administrators', 'participants', 'experiments', etc.
  foreign_id integer NOT NULL, -- maps to the primary key (id) of the relation denoted above

  expires timestamp with time zone,
  redacted timestamp with time zone,
  created timestamp with time zone DEFAULT current_timestamp NOT NULL,

  UNIQUE(token, relation)
);
CREATE INDEX access_tokens_token_idx ON access_tokens(token);

CREATE TABLE templates (
  id serial PRIMARY KEY,

  name text UNIQUE, -- soft referenced from stims.template
  html text,

  created timestamp with time zone DEFAULT current_timestamp NOT NULL
);

CREATE TABLE experiments (
  id serial PRIMARY KEY,

  name text,
  -- slug text,
  administrator_id integer REFERENCES administrators(id), -- owner
  html text, -- to be included on every page, at the top of the <body>

  -- `parameters` should match the keys of each stim's `context` object, or most of them
  -- not really necessary, except to impose an ordering
  parameters text[] DEFAULT '{}'::text[],

  created timestamp with time zone DEFAULT current_timestamp NOT NULL
);

-- `stim` refers to a completely specified stimulus,
-- not just the "type" of stimulus, which is designated by `template`
CREATE TABLE stims (
  id serial PRIMARY KEY,

  experiment_id integer REFERENCES experiments(id),
  template_id integer REFERENCES templates(id),
  -- remove this template?
  -- template text, -- soft reference to templates(name)
  context json,
  view_order integer,

  created timestamp with time zone DEFAULT current_timestamp NOT NULL
);
-- is this index necessary, considering the FK?
-- CREATE INDEX stims_experiment_id_idx ON stims(experiment_id); -- USING btree


CREATE TABLE responses (
  id serial PRIMARY KEY,

  -- there may be multiple respones per stim, so we don't set a unique on (participant_id, stim_id)
  participant_id integer REFERENCES participants(id) NOT NULL,
  stim_id integer REFERENCES stims(id),
  value json,

  -- having an optional assignment_id allows merging the data on mturk into the local database,
  -- while the unique constraint prevents merging duplicates.
  -- this will be NULL for most responses.
  assignment_id text UNIQUE,

  created timestamp with time zone DEFAULT current_timestamp NOT NULL
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
  id serial PRIMARY KEY,

  name text UNIQUE,
  access_key_id text NOT NULL, -- accessKeyId
  secret_access_key text NOT NULL, -- secretAccessKey

  created timestamp with time zone DEFAULT current_timestamp NOT NULL
);

CREATE TABLE aws_account_administrators (
  id serial PRIMARY KEY,

  aws_account_id integer REFERENCES aws_accounts(id) NOT NULL,
  administrator_id integer REFERENCES administrators(id) NOT NULL,
  priority integer,
  -- role ...

  created timestamp with time zone DEFAULT current_timestamp NOT NULL,

  UNIQUE(aws_account_id, administrator_id) --, role
);
