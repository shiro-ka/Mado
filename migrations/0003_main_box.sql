-- Per-user "main Mado" override.
-- Apply (local):  wrangler d1 execute mado --local  --file migrations/0003_main_box.sql
-- Apply (remote): wrangler d1 execute mado --remote --file migrations/0003_main_box.sql
--
-- Background: the "main box" is the one pinned to the top of /@handle and shown
-- as the featured send form to visitors. By default it's the owner's oldest box;
-- this column lets an owner override that choice. NULL / a dangling rkey falls
-- back to the oldest-box default at read time.

ALTER TABLE users ADD COLUMN main_box_rkey TEXT;
