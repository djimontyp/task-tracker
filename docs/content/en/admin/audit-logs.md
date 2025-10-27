# Audit Logs Guide

**Last Updated:** October 26, 2025
**Status:** Complete
**Audience:** System Administrators

## What Gets Logged

Every automation decision is recorded in the `automation_audit_log` table.

### Log Entry Structure

```sql
CREATE TABLE automation_audit_log (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMP,      -- When decision made
    rule_id INT,               -- Which rule triggered
    action VARCHAR(50),        -- approve/reject/manual
    version_id INT,            -- Which version processed
    entity_type VARCHAR(50),   -- topic/atom
    confidence FLOAT,          -- Extracted confidence score
    similarity FLOAT,          -- Extracted similarity score
    message_count INT,         -- Supporting messages
    is_success BOOLEAN,        -- Action completed?
    error_message TEXT,        -- If failed, what went wrong
    execution_time_ms INT      -- How long it took
);
```

## Query Examples

### Daily Statistics

```sql
SELECT
  DATE(created_at) as date,
  action,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY DATE(created_at)), 1) as pct,
  ROUND(AVG(confidence), 1) as avg_confidence,
  ROUND(AVG(similarity), 1) as avg_similarity,
  ROUND(AVG(execution_time_ms), 0) as avg_time_ms
FROM automation_audit_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), action
ORDER BY date DESC, action;
```

**Output:**
```
date       action  count  pct    avg_confidence  avg_similarity  avg_time_ms
2025-10-26 approve 34     72%    88.5            79.2            2.1
2025-10-26 reject  5      11%    38.2            42.1            0.8
2025-10-26 manual  8      17%    65.4            68.9            1.2
2025-10-25 approve 41     78%    87.9            80.1            2.3
...
```

### Most Triggered Rules

```sql
SELECT
  r.name,
  COUNT(*) as times_triggered,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM automation_audit_log), 1) as percentage,
  SUM(CASE WHEN aal.is_success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT aal.is_success THEN 1 ELSE 0 END) as failed
FROM automation_audit_log aal
JOIN approval_rules r ON aal.rule_id = r.id
WHERE aal.created_at >= NOW() - INTERVAL '30 days'
GROUP BY r.id, r.name
ORDER BY COUNT(*) DESC;
```

**Output:**
```
name                               times_triggered  percentage  successful  failed
High Confidence Auto-Approve       245              62%         242         3
Standard Auto-Approve              120              30%         118         2
Auto-Reject Low Quality            35               9%          34          1
```

### False Positive Rate

```sql
-- Manual review of approved versions to count actual errors
SELECT
  DATE(created_at) as date,
  COUNT(*) as auto_approved,
  SUM(CASE WHEN reviewed_as_bad = true THEN 1 ELSE 0 END) as false_positives,
  ROUND(100.0 * SUM(CASE WHEN reviewed_as_bad = true THEN 1 ELSE 0 END) / COUNT(*), 1) as fp_rate
FROM automation_audit_log
WHERE action = 'approve'
  AND created_at >= NOW() - INTERVAL '30 days'
  AND reviewed_as_bad IS NOT NULL  -- Manually reviewed
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Execution Time Analysis

```sql
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY execution_time_ms) as p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as p99_ms,
  MAX(execution_time_ms) as max_ms
FROM automation_audit_log
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Output:**
```
p50_ms  p95_ms  p99_ms  max_ms
2.1     8.3     15.2    45.1
```

**Target:** P95 < 10ms

### Failed Actions

```sql
SELECT
  created_at,
  rule_id,
  action,
  version_id,
  error_message
FROM automation_audit_log
WHERE is_success = false
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

**Common errors:**
- "Version already approved" (idempotency issue)
- "Entity not found" (deleted between creation and approval)
- "Database transaction failed" (connection issues)

## Log Retention Policy

### Default Settings

```yaml
retention:
  keep_for_days: 90        # Keep 90 days of logs
  archive_after_days: 30   # Archive to cold storage after 30 days
  delete_after_days: 365   # Hard delete after 1 year
```

### Manual Cleanup

```sql
-- Delete logs older than 90 days
DELETE FROM automation_audit_log
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive to separate table
INSERT INTO automation_audit_log_archive
SELECT * FROM automation_audit_log
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Compliance Considerations

### Audit Trail Requirements

Logs support compliance for:
- **SOC 2**: Documented system changes
- **HIPAA** (if applicable): User action tracking
- **GDPR**: Data modification history

### Data Retention

```
Requirement: Keep logs for 2 years
Action: Set retention to 730 days
```

### Access Control

Restrict audit log access:

```sql
-- Only admins can view
GRANT SELECT ON automation_audit_log TO admin_role;
REVOKE SELECT ON automation_audit_log FROM public;
```

### Log Integrity

Prevent tampering:

```sql
-- Add immutable column
ALTER TABLE automation_audit_log
ADD CONSTRAINT no_delete CHECK (1=1);  -- Prevent deletes

-- Trigger for audit trail of deletes
CREATE TRIGGER log_audit_log_deletes
BEFORE DELETE ON automation_audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_delete();
```

## Performance Impact

### Index Optimization

Critical indexes for audit log queries:

```sql
-- Query by date range (most common)
CREATE INDEX idx_automation_audit_log_created_at
ON automation_audit_log(created_at DESC);

-- Query by rule
CREATE INDEX idx_automation_audit_log_rule_id
ON automation_audit_log(rule_id, created_at);

-- Query by action
CREATE INDEX idx_automation_audit_log_action
ON automation_audit_log(action, created_at);
```

### Table Size Management

```bash
# Check table size
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
   FROM pg_tables
   WHERE tablename = 'automation_audit_log';"
```

**Expected growth:**
- 47 versions × 365 days = 17,155 log entries/year
- ~200 KB per year (uncompressed)
- 90-day retention = ~5 MB

---

**Related:** [Job Management](job-management.md) | [Performance & Scaling](performance-scaling.md)
