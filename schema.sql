-- $ dropdb human; createdb human; psql human -f schema.sql

CREATE TABLE aws_accounts (
  id serial PRIMARY KEY,

  name text UNIQUE,
  access_key_id text NOT NULL, -- accessKeyId
  secret_access_key text NOT NULL, -- secretAccessKey

  created timestamp DEFAULT current_timestamp NOT NULL
);

CREATE TABLE administrators (
  id serial PRIMARY KEY,

  email text UNIQUE NOT NULL,
  password text NOT NULL
    CHECK (length(password) = 64), -- sha256 hex digest produces 64-long string

  created timestamp DEFAULT current_timestamp NOT NULL
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

  created timestamp DEFAULT current_timestamp NOT NULL
);

CREATE TABLE tickets (
  id serial PRIMARY KEY,

  key text UNIQUE NOT NULL, -- hash, ticket
  user_id integer NOT NULL, -- maps to either an administrator or a participant

  expires timestamp,
  created timestamp DEFAULT current_timestamp NOT NULL
);
CREATE INDEX tickets_key_idx ON tickets (key);

CREATE TABLE templates (
  id serial PRIMARY KEY,

  name text UNIQUE, -- soft referenced from stims.template
  html text,

  created timestamp DEFAULT current_timestamp NOT NULL
);

CREATE TABLE experiments (
  id serial PRIMARY KEY,

  name text,
  administrator_id integer REFERENCES administrators(id), -- owner

  -- `parameters` should match the keys of each stim's `context` object, or most of them
  -- not really necessary, except to impose an ordering
  parameters text[],

  created timestamp DEFAULT current_timestamp NOT NULL
);

-- `stim` refers to a completely specified stimulus,
-- not just the "type" of stimulus, which is designated by `template`
CREATE TABLE stims (
  id serial PRIMARY KEY,

  experiment_id integer REFERENCES experiments(id),
  template text, -- soft reference to templates(name)
  context json,
  view_order integer,

  created timestamp DEFAULT current_timestamp NOT NULL
);
-- CREATE INDEX stims_experiment_id_idx ON stims(experiment_id); -- USING btree -- necessary, considering the FK?

CREATE TABLE responses (
  id serial PRIMARY KEY,

  -- there may be multiple respones per stim, so we don't
  participant_id integer REFERENCES participants(id) NOT NULL,
  stim_id integer REFERENCES stims(id),
  value json,

  created timestamp DEFAULT current_timestamp NOT NULL
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
