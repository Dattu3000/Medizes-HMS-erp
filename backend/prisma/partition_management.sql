-- =============================================================================
-- Medisys HMS v6.0 — Automated Partition Management (Supabase Compatible)
-- =============================================================================
-- Purpose:
--   Automatically provisions monthly range partitions 2 months in advance
--   for all partitioned GST reconciliation tables.
--
-- Why not pg_partman?
--   Supabase (managed PostgreSQL) does not support the pg_partman extension.
--   This PL/pgSQL function replicates the core "premake" behaviour and can
--   be called by a Supabase Edge Function cron, pg_cron, or the application's
--   node-cron scheduler.
--
-- Schedule:
--   Run monthly on the 1st at 00:00 UTC (or via application cron).
--   Creates partitions for current month + 2 months ahead.
-- =============================================================================

CREATE OR REPLACE FUNCTION provision_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    target_period  INT;
    target_year    INT;
    target_month   INT;
    next_year      INT;
    next_month     INT;
    partition_name TEXT;
    start_range    INT;
    end_range      INT;
    i              INT;
    base_tables    TEXT[] := ARRAY[
        'purchase_register_invoices',
        'gstr2b_invoices',
        'recon_invoice_matches'
    ];
    prefixes       TEXT[] := ARRAY[
        'pr_invoices',
        'gstr2b_invoices',
        'recon_matches'
    ];
    tbl            TEXT;
    pfx            TEXT;
BEGIN
    -- Generate partitions for current month and 2 months ahead (premake = 2)
    FOR i IN 0..2 LOOP
        -- Calculate the target month/year
        target_year  := EXTRACT(YEAR FROM (CURRENT_DATE + (i || ' months')::INTERVAL))::INT;
        target_month := EXTRACT(MONTH FROM (CURRENT_DATE + (i || ' months')::INTERVAL))::INT;
        
        -- Calculate the NEXT month (for range upper bound)
        next_year  := EXTRACT(YEAR FROM (CURRENT_DATE + ((i + 1) || ' months')::INTERVAL))::INT;
        next_month := EXTRACT(MONTH FROM (CURRENT_DATE + ((i + 1) || ' months')::INTERVAL))::INT;

        -- Build YYYYMM integers for range boundaries
        start_range := target_year * 100 + target_month;
        end_range   := next_year * 100 + next_month;

        -- Create partition for each base table
        FOR j IN 1..array_length(base_tables, 1) LOOP
            tbl := base_tables[j];
            pfx := prefixes[j];
            
            partition_name := pfx || '_y' || target_year::TEXT || 'm' || LPAD(target_month::TEXT, 2, '0');

            -- Check if partition already exists before creating
            IF NOT EXISTS (
                SELECT 1 FROM pg_class
                WHERE relname = partition_name
                  AND relkind = 'r'
            ) THEN
                EXECUTE format(
                    'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%s) TO (%s)',
                    partition_name, tbl, start_range, end_range
                );
                RAISE NOTICE 'Created partition: % (% to %)', partition_name, start_range, end_range;
            ELSE
                RAISE NOTICE 'Partition already exists: %', partition_name;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- =============================================================================
-- Execute immediately to provision any missing partitions
-- =============================================================================
SELECT provision_monthly_partitions();

-- =============================================================================
-- Optional: Schedule with pg_cron (if available on Supabase Pro plan)
-- =============================================================================
-- SELECT cron.schedule(
--     'provision-gst-partitions',    -- job name
--     '0 0 1 * *',                   -- 1st of every month at midnight UTC
--     $$SELECT provision_monthly_partitions()$$
-- );

-- =============================================================================
-- Alternative: Call from Node.js application cron (node-cron)
-- =============================================================================
-- In cron.ts, add:
--   cron.schedule('0 0 1 * *', async () => {
--       await prisma.$executeRaw`SELECT provision_monthly_partitions()`;
--   });
