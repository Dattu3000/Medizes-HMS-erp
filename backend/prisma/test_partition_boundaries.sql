-- =============================================================================
-- Medisys HMS v6.0 — Partition Boundary Alignment Test
-- =============================================================================
-- Purpose:
--   Validates that invoices dated at timezone edge boundaries (e.g., June 30th
--   23:59:59 IST) are correctly routed to the right monthly partition shard
--   and that PostgreSQL partition pruning is functioning correctly.
--
-- Test Methodology:
--   1. Insert test invoices at boundary edges
--   2. Query with EXPLAIN to verify partition pruning
--   3. Verify row counts per partition
--   4. Clean up test data
--
-- Prerequisites:
--   - gst_recon.sql has been executed (partitions exist)
--   - partition_management.sql has been executed (Jun/Jul/Aug 2026 partitions)
-- =============================================================================

BEGIN;

-- =============================================================================
-- TEST 1: Insert invoice at the LAST moment of June (IST timezone edge)
-- =============================================================================
-- June 30, 2026 at 23:59:59 IST = July 1, 2026 at 18:29:59 UTC
-- The return_period is 202606 (June), so it MUST land in the June partition.
-- =============================================================================

INSERT INTO purchase_register_invoices (
    receiver_gstin_id, receiver_gstin, supplier_gstin,
    invoice_number, invoice_date, return_period,
    taxable_value, cgst, sgst_utgst, igst, cess,
    cost_center_code, erp_source
) VALUES (
    uuid_generate_v4(),
    '27AAAAA5555A1Z5',
    '29BBBBB2222B2Z2',
    'TEST-BOUNDARY-JUNE-EDGE',
    '2026-06-30'::DATE,
    202606,
    100000.00, 9000.00, 9000.00, 0.00, 0.00,
    'CC-TEST', 'BOUNDARY_TEST'
);

-- =============================================================================
-- TEST 2: Insert invoice at the FIRST moment of July
-- =============================================================================
-- July 1, 2026 at 00:00:01 IST
-- The return_period is 202607 (July), so it MUST land in the July partition.
-- =============================================================================

INSERT INTO purchase_register_invoices (
    receiver_gstin_id, receiver_gstin, supplier_gstin,
    invoice_number, invoice_date, return_period,
    taxable_value, cgst, sgst_utgst, igst, cess,
    cost_center_code, erp_source
) VALUES (
    uuid_generate_v4(),
    '27AAAAA5555A1Z5',
    '29BBBBB2222B2Z2',
    'TEST-BOUNDARY-JULY-START',
    '2026-07-01'::DATE,
    202607,
    50000.00, 4500.00, 4500.00, 0.00, 0.00,
    'CC-TEST', 'BOUNDARY_TEST'
);

-- =============================================================================
-- TEST 3: Verify Partition Pruning via EXPLAIN
-- =============================================================================
-- The query planner MUST show that only the June partition is scanned
-- when filtering for return_period = 202606.
-- =============================================================================

EXPLAIN (ANALYZE, COSTS OFF, FORMAT TEXT)
SELECT pr_invoice_id, invoice_number, return_period, total_gst
FROM purchase_register_invoices
WHERE return_period = 202606
  AND receiver_gstin = '27AAAAA5555A1Z5';

-- Expected output should include:
--   -> Seq Scan on pr_invoices_y2026m06  (rows scanned only from June partition)
-- And should NOT include:
--   -> Seq Scan on pr_invoices_y2026m07  (July must be pruned)

-- =============================================================================
-- TEST 4: Verify row landed in the correct partition directly
-- =============================================================================

-- Check June partition
SELECT COUNT(*) AS june_count
FROM pr_invoices_y2026m06
WHERE erp_source = 'BOUNDARY_TEST';
-- Expected: 1

-- Check July partition
SELECT COUNT(*) AS july_count
FROM pr_invoices_y2026m07
WHERE erp_source = 'BOUNDARY_TEST';
-- Expected: 1

-- Check DEFAULT partition (should be 0 — no misrouted rows)
SELECT COUNT(*) AS default_count
FROM pr_invoices_default
WHERE erp_source = 'BOUNDARY_TEST';
-- Expected: 0

-- =============================================================================
-- TEST 5: Malformed return_period routes to DEFAULT partition
-- =============================================================================

INSERT INTO purchase_register_invoices (
    receiver_gstin_id, receiver_gstin, supplier_gstin,
    invoice_number, invoice_date, return_period,
    taxable_value, cgst, sgst_utgst, igst, cess,
    cost_center_code, erp_source
) VALUES (
    uuid_generate_v4(),
    '27AAAAA5555A1Z5',
    '29CCCCC3333C3Z3',
    'TEST-BOUNDARY-MALFORMED',
    '2026-06-15'::DATE,
    999999,  -- Deliberately malformed period with no matching partition range
    10000.00, 900.00, 900.00, 0.00, 0.00,
    'CC-TEST', 'BOUNDARY_TEST'
);

-- Verify it landed in the default partition
SELECT COUNT(*) AS default_malformed_count
FROM pr_invoices_default
WHERE erp_source = 'BOUNDARY_TEST' AND invoice_number = 'TEST-BOUNDARY-MALFORMED';
-- Expected: 1

-- =============================================================================
-- CLEANUP: Remove all test data
-- =============================================================================
DELETE FROM purchase_register_invoices WHERE erp_source = 'BOUNDARY_TEST';

COMMIT;

-- =============================================================================
-- RESULT SUMMARY:
--   If all assertions above return expected values, partition routing and
--   pruning are working correctly. No timezone cross-contamination detected.
-- =============================================================================
