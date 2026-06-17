-- =============================================================================
-- Medisys HMS v6.0 — Production Safety: Lock & Statement Timeout Configuration
-- =============================================================================
-- Purpose:
--   Prevents exclusive table locks from cascading transaction queue blocks
--   during live schema migrations on core hospital billing and pharmacy tables.
--
-- Enforcement:
--   - statement_timeout = 10s  → Abort any single query exceeding 10 seconds
--   - lock_timeout      = 4s   → Abort if an exclusive lock cannot be acquired
--                                 within 4 seconds (prevents migration deadlocks)
--
-- Scope:
--   Applied at the DATABASE level so all new connections inherit these defaults.
--   Individual sessions can override with SET LOCAL if needed (e.g., batch jobs).
--
-- Run this ONCE against the production database before deploying schema changes.
-- =============================================================================

-- 1. Set database-level defaults (inherited by all new connections)
ALTER DATABASE postgres SET statement_timeout = '10000';   -- 10 seconds
ALTER DATABASE postgres SET lock_timeout = '4000';          -- 4 seconds

-- 2. Verify the settings are persisted
-- After reconnecting, run:
--   SHOW statement_timeout;   → should return '10s'
--   SHOW lock_timeout;        → should return '4s'

-- 3. For migration sessions that need longer timeouts (e.g., large backfills),
--    override temporarily within the session:
--
--   SET LOCAL statement_timeout = '60000';  -- 60 seconds for this transaction
--   SET LOCAL lock_timeout = '10000';       -- 10 seconds for this transaction
--   ... run migration ...
--   RESET statement_timeout;
--   RESET lock_timeout;

COMMENT ON DATABASE postgres IS 'Medisys HMS Production — statement_timeout=10s, lock_timeout=4s enforced';
