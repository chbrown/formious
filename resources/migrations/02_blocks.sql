-- experiments.parameters is not really that useful, and can be misleading
ALTER TABLE experiments DROP COLUMN parameters;

-- remove FK on "responses" table
ALTER TABLE responses DROP CONSTRAINT responses_stim_id_fkey;
ALTER TABLE responses RENAME COLUMN stim_id TO block_id;

-- make main changes to "blocks" table
ALTER TABLE stims RENAME TO blocks;
ALTER TABLE blocks
  ADD COLUMN randomize BOOLEAN DEFAULT FALSE NOT NULL,
  -- as container
  -- (parent_block_id IS NULL) indicates top-level block
  ADD COLUMN parent_block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
  -- (template_id IS NULL) indicates block container
  ALTER COLUMN template_id DROP NOT NULL;

-- knowing the experiment id for all involved blocks helps to reconstruct
-- the tree quickly without multiple serial queries, so we keep experiment_id as is.

-- put FK back on "responses" table
ALTER TABLE responses ADD CONSTRAINT responses_block_id_fkey FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE;
