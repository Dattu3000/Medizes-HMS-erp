# Multi-Tenant Production Deployment & Migration Checklist

### Target Stack: PostgreSQL 15+ | Prisma ORM | Monthly Range Partitioning

> **Scope:** Moving the multi-tenant, horizontally partitioned financial engine (handling high-volume hospital and corporate transactions) into production with zero tolerance for data leaks or transaction blocks.

---

## 1. Zero-Downtime Schema Drift & Lock Management

When executing schema migrations on core multi-specialty hospital datasets, preventing exclusive table locks is critical to avoid interrupting live patient billing entries or automated pharmacy queues.

- [ ] **Validate Lock Timeouts:** Enforce strict query lock timeouts before firing schema updates. Any statement that hangs for more than 4 seconds must abort automatically to prevent transaction queue cascading.
  ```sql
  SET statement_timeout = '10000'; -- Abort queries taking > 10s
  SET lock_timeout = '4000';       -- Abort if lock cannot be acquired in 4s
  ```

- [ ] **Deploy Indexes Concurrently:** Never deploy standard `CREATE INDEX` scripts on production tables with millions of records; it locks out writes. Ensure all raw SQL migration vectors use the `CONCURRENTLY` modifier.
  ```sql
  CREATE INDEX CONCURRENTLY idx_tenant_ledger_lookup
  ON purchase_register_invoices (tenant_id, return_period, vendor_gstin);
  ```

- [ ] **Isolate Alterations on Master Partition Templates:** When adding columns (like Phase 3 governance extensions), ensure modifications target the master partition root table. PostgreSQL will safely ripple the structural changes down to individual monthly child shards (`pr_invoices_y2026m06`, etc.) sequentially.

---

## 2. Multi-Tenant Row-Level Isolation & RLS Verification

In a B2B corporate enterprise SaaS setup, one tenant must *never* catch a glimpse of another tenant's financial metrics. Relying purely on application-layer `where: { tenantId }` constraints is high risk.

- [ ] **Enable Native PostgreSQL Row-Level Security (RLS):** Apply true RLS security policies across all core structural ledger and disbursement data entities.
  ```sql
  ALTER TABLE purchase_register_invoices ENABLE ROW LEVEL SECURITY;

  CREATE POLICY tenant_isolation_policy ON purchase_register_invoices
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));
  ```

- [ ] **Wire RLS Session Injection into Prisma Connection Pool:** Ensure that the data access middleware explicitly primes the PostgreSQL thread session context with the current tenant's unique identifier immediately upon opening a connection.
  ```typescript
  // In db.ts database context extension wrapper
  prisma.$use(async (params, next) => {
    const activeTenantId = tenantStorageContext.getStore()?.tenantId;
    if (activeTenantId) {
      await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${activeTenantId}';`);
    }
    return next(params);
  });
  ```

- [ ] **Enforce Isolation within the Shadow Audit Trail:** Verify that the `FinancialAuditLog` model captures the parent record's `tenantId`. A common enterprise failure occurs when audit trails are dumped into a single global table without tenant indexing, resulting in cross-tenant data leaks during historical reporting requests.

---

## 3. Dynamic Partition Pre-Provisional Infrastructure

Since the engine uses range partitioning based on the compliance month (`return_period` formatted as `YYYYMM`), a missing table partition for a future month will cause the entire transaction pipeline to crash instantly with unhandled database write rejections.

- [ ] **Deploy Automated Partition Management (`pg_partman`):** Configure the database engine to automatically build partitions 2 months in advance. Do not rely on developers remembering to manually generate future shards.

- [ ] **Configure the Fail-Safe Default Shard:** Attach a `DEFAULT` partition catching mechanism to partitioned root tables. Any malformed inbound date payloads from legacy corporate ERPs will route into this bucket instead of throwing fatal operational exceptions.
  ```sql
  CREATE TABLE pr_invoices_default PARTITION OF purchase_register_invoices DEFAULT;
  ```

- [ ] **Verify Boundary Alignment for Multi-Month Invoices:** Test vendor bills dated on timezone edges (e.g., June 30th, 11:59:59 PM IST). Ensure the database optimization layer runs correct **Partition Pruning** to route the row to the exact monthly slice without boundary cross-contamination.

---

## 4. Multi-Tenant Resource Throttle & Pool Sizing

Multi-million row GSTR-2B automated reconciliation processes can easily exhaust the database connection pool, starving fast-running frontend user queries (like logging an OPD expense voucher).

- [ ] **Segregate Background Query Pools:** Allocate two separate database connection strings inside the environment configuration matrix:
  - `MAIN_DATABASE_URL`: Set with a high connection limit, optimized for rapid, transactional API endpoints.
  - `BATCH_CRON_DATABASE_URL`: Mapped with a restrictive, low concurrency cap specifically for the nightly 01:00 AM anomaly sync engine.

- [ ] **Configure Streaming Query Limits on Large File Generators:** When compiling pipe-delimited NSDL text output documents, replace standard array mappings (`prisma.disbursement.findMany`) with low-memory cursor pipelines (`prisma.$queryRaw` using PostgreSQL server-side cursors). This keeps runtime containers from running out of memory when processing hundreds of thousands of physician disbursement lines.

---

## 5. Pre-Flight Production Health Verification Sign-Off

Before running the automated deployment script, verify that the staging environment passes this validation matrix:

| Verification Target | Expected Behavioral Characteristic | Pass |
| :--- | :--- | :---: |
| **Maker-Checker Loop** | Attempted self-approvals throw an explicit multi-role error code and completely rollback the database transaction. | [ ] |
| **Pharmacy Exemption Guard** | Submitting a pharmacy log with an `EXEMPT` tag flags a client-side validation fault before hitting the network layer. | [ ] |
| **NSDL Line Delimiter Format** | Exported text return assets contain explicit carriage returns (`\r\n`) to prevent NSDL FVU utility processing failures. | [ ] |
| **Audit Delta Snapshots** | Mutating database rows records a clear, deep JSON diff profile containing both the historical and new state attributes. | [ ] |

---

> ### 🚀 Infrastructure Director Note
> "Ensure your production logging framework (e.g., Winston, Datadog) masks raw financial values, PAN indicators, and patient healthcare identities within the application logs. While the `FinancialAuditLog` database table securely encrypts data snapshots at rest, capturing these records in plain text files inside server tracking utilities violates basic data privacy compliance codes."
