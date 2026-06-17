-- Enable necessary extensions for text sanitization optimization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BASE RECIPIENT GSTIN TABLE
CREATE TABLE IF NOT EXISTS company_gstins (
    gstin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gstin_number VARCHAR(15) UNIQUE NOT NULL CHECK (gstin_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    legal_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PURCHASE REGISTER (PR) - PARTITIONED BY MONTH
CREATE TABLE IF NOT EXISTS purchase_register_invoices (
    pr_invoice_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    receiver_gstin_id UUID NOT NULL,
    receiver_gstin VARCHAR(15) NOT NULL,
    supplier_gstin VARCHAR(15) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    
    sanitized_invoice_number VARCHAR(50) GENERATED ALWAYS AS (
        REGEXP_REPLACE(LTRIM(UPPER(invoice_number), '0'), '[^A-Z0-9]', '', 'g')
    ) STORED,
    
    invoice_date DATE NOT NULL,
    return_period INT NOT NULL,
    
    taxable_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cgst NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sgst_utgst NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    igst NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cess NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_gst NUMERIC(15,2) GENERATED ALWAYS AS (cgst + sgst_utgst + igst + cess) STORED,
    
    cost_center_code VARCHAR(50),
    erp_source VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (pr_invoice_id, return_period)
) PARTITION BY RANGE (return_period);

-- 3. GSTR-2B DOWNLOADED STATEMENT - PARTITIONED BY MONTH
CREATE TABLE IF NOT EXISTS gstr2b_invoices (
    gstr2b_invoice_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    receiver_gstin VARCHAR(15) NOT NULL,
    supplier_gstin VARCHAR(15) NOT NULL,
    supplier_legal_name VARCHAR(255),
    invoice_number VARCHAR(50) NOT NULL,
    
    sanitized_invoice_number VARCHAR(50) GENERATED ALWAYS AS (
        REGEXP_REPLACE(LTRIM(UPPER(invoice_number), '0'), '[^A-Z0-9]', '', 'g')
    ) STORED,
    
    invoice_date DATE NOT NULL,
    invoice_type VARCHAR(20),
    return_period INT NOT NULL,
    gstr1_filing_date DATE,
    itc_availability VARCHAR(20) CHECK (itc_availability IN ('AVAILABLE', 'NOT_AVAILABLE')),
    itc_reversal_reason VARCHAR(255),
    
    taxable_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cgst NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sgst_utgst NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    igst NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cess NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_gst NUMERIC(15,2) GENERATED ALWAYS AS (cgst + sgst_utgst + igst + cess) STORED,
    
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (gstr2b_invoice_id, return_period)
) PARTITION BY RANGE (return_period);

-- 4. RECONCILIATION MATCH MAPPER - PARTITIONED BY MONTH
CREATE TABLE IF NOT EXISTS recon_invoice_matches (
    recon_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    return_period INT NOT NULL,
    receiver_gstin VARCHAR(15) NOT NULL,
    pr_invoice_id UUID,
    gstr2b_invoice_id UUID,
    
    match_category VARCHAR(30) NOT NULL CHECK (match_category IN (
        'EXACT_MATCH', 
        'PARTIAL_MATCH_TAX_MISMATCH', 
        'PARTIAL_MATCH_DATE_MISMATCH', 
        'PR_ONLY_MISSING_IN_2B', 
        'GSTR2B_ONLY_MISSING_IN_PR'
    )),
    
    variance_taxable_value NUMERIC(15,2) DEFAULT 0.00,
    variance_total_gst NUMERIC(15,2) DEFAULT 0.00,
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reconciled_by_user_id UUID,
    
    PRIMARY KEY (recon_id, return_period)
) PARTITION BY RANGE (return_period);

-- Sample Partitions for Jun, Jul, Aug 2026
CREATE TABLE IF NOT EXISTS pr_invoices_y2026m06 PARTITION OF purchase_register_invoices FOR VALUES FROM (202606) TO (202607);
CREATE TABLE IF NOT EXISTS gstr2b_invoices_y2026m06 PARTITION OF gstr2b_invoices FOR VALUES FROM (202606) TO (202607);
CREATE TABLE IF NOT EXISTS recon_matches_y2026m06 PARTITION OF recon_invoice_matches FOR VALUES FROM (202606) TO (202607);

CREATE TABLE IF NOT EXISTS pr_invoices_y2026m07 PARTITION OF purchase_register_invoices FOR VALUES FROM (202607) TO (202608);
CREATE TABLE IF NOT EXISTS gstr2b_invoices_y2026m07 PARTITION OF gstr2b_invoices FOR VALUES FROM (202607) TO (202608);
CREATE TABLE IF NOT EXISTS recon_matches_y2026m07 PARTITION OF recon_invoice_matches FOR VALUES FROM (202607) TO (202608);

-- =============================================================================
-- FAIL-SAFE DEFAULT PARTITIONS
-- =============================================================================
-- Routes any rows with malformed or unexpected return_period values into a
-- catch-all bucket instead of crashing the write pipeline with unhandled
-- database rejection errors. Must be monitored and drained periodically.
-- =============================================================================
CREATE TABLE IF NOT EXISTS pr_invoices_default PARTITION OF purchase_register_invoices DEFAULT;
CREATE TABLE IF NOT EXISTS gstr2b_invoices_default PARTITION OF gstr2b_invoices DEFAULT;
CREATE TABLE IF NOT EXISTS recon_matches_default PARTITION OF recon_invoice_matches DEFAULT;

-- =============================================================================
-- INDEXES (CONCURRENTLY)
-- =============================================================================
-- IMPORTANT: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- If executing via Prisma's executeRaw or a migration tool, ensure each
-- statement runs outside of BEGIN/COMMIT. In psql, run each line individually.
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pr_recon_lookup ON purchase_register_invoices (receiver_gstin, supplier_gstin, sanitized_invoice_number, return_period);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pr_high_value_gst ON purchase_register_invoices (return_period, total_gst) WHERE total_gst > 50000.00;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gstr2b_recon_lookup ON gstr2b_invoices (receiver_gstin, supplier_gstin, sanitized_invoice_number, return_period);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gstr2b_itc_blocked ON gstr2b_invoices (receiver_gstin, return_period) WHERE itc_availability = 'NOT_AVAILABLE';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recon_category_search ON recon_invoice_matches (receiver_gstin, return_period, match_category);
