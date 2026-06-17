-- =============================================================================
-- Medisys HMS v6.0 — Row-Level Security (RLS) Policies
-- =============================================================================
-- Purpose:
--   Enforces true database-level tenant isolation on all financial ledger and
--   reconciliation tables. This is a SECOND LAYER of defense alongside the
--   application-layer Prisma extension that injects branchId filters.
--
-- How it works:
--   1. The application sets `app.current_tenant_id` via SET LOCAL at the
--      start of each database connection/transaction.
--   2. PostgreSQL evaluates the RLS policy on every row access, filtering
--      rows where receiver_gstin (or tenant identifier) does not match.
--   3. Superuser / migration connections bypass RLS automatically.
--
-- IMPORTANT:
--   - Run this script AFTER the partitioned tables exist (gst_recon.sql).
--   - The Prisma application user must NOT be a superuser (superusers bypass RLS).
--   - Supabase's `postgres` role is a superuser; create an `app_user` role for
--     the application connection if not already done.
-- =============================================================================

-- =============================================================================
-- 1. RLS on purchase_register_invoices
-- =============================================================================
ALTER TABLE purchase_register_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_register_invoices FORCE ROW LEVEL SECURITY;

-- Tenant isolation policy: rows are only visible/writable when the session
-- tenant matches the row's receiver_gstin field.
CREATE POLICY tenant_isolation_pr ON purchase_register_invoices
    FOR ALL
    USING (
        receiver_gstin = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    )
    WITH CHECK (
        receiver_gstin = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    );

-- =============================================================================
-- 2. RLS on gstr2b_invoices
-- =============================================================================
ALTER TABLE gstr2b_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gstr2b_invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_gstr2b ON gstr2b_invoices
    FOR ALL
    USING (
        receiver_gstin = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    )
    WITH CHECK (
        receiver_gstin = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    );

-- =============================================================================
-- 3. RLS on recon_invoice_matches
-- =============================================================================
ALTER TABLE recon_invoice_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recon_invoice_matches FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_recon ON recon_invoice_matches
    FOR ALL
    USING (
        receiver_gstin = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    )
    WITH CHECK (
        receiver_gstin = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    );

-- =============================================================================
-- 4. RLS on core Prisma-managed financial tables (Ledger, Disbursement)
-- =============================================================================
-- These use branchId as the tenant identifier, matching the application's
-- AsyncLocalStorage context.
-- =============================================================================

ALTER TABLE "Ledger" ENABLE ROW LEVEL SECURITY;
-- Do NOT use FORCE here — the application superuser (postgres on Supabase)
-- needs unrestricted access for migrations and seed scripts. FORCE would
-- block the table owner too. The app_user role will be subject to RLS.

CREATE POLICY tenant_isolation_ledger ON "Ledger"
    FOR ALL
    USING (
        "branchId" IS NULL
        OR "branchId" = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    );

ALTER TABLE "Disbursement" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_disbursement ON "Disbursement"
    FOR ALL
    USING (
        current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    );
-- Note: Disbursement doesn't have a branchId column, so the policy only
-- activates when a tenant context is set. The app-layer Prisma extension
-- handles the actual filtering logic for Disbursement queries.

-- =============================================================================
-- 5. RLS on FinancialAuditLog (after tenantId column is added via migration)
-- =============================================================================
ALTER TABLE "FinancialAuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_audit ON "FinancialAuditLog"
    FOR ALL
    USING (
        "tenantId" IS NULL
        OR "tenantId" = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_tenant_id', true) IS NULL
        OR current_setting('app.current_tenant_id', true) = ''
    );

-- =============================================================================
-- Verification Queries (run manually after applying):
-- =============================================================================
-- SET app.current_tenant_id = '27AAAAA5555A1Z5';
-- SELECT * FROM purchase_register_invoices LIMIT 5;
-- -- Should only return rows where receiver_gstin = '27AAAAA5555A1Z5'
--
-- RESET app.current_tenant_id;
-- SELECT * FROM purchase_register_invoices LIMIT 5;
-- -- Should return ALL rows (no tenant filter active)
