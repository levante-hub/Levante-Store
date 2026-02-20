---
name: sql-optimization
description: Techniques for writing performant SQL queries, indexing strategies, query plan analysis, and schema design for scale. Focused on PostgreSQL.
author: levante
version: "1.0.0"
license: MIT
tags: [SQL, PostgreSQL, Performance, Indexing, Query, Database]
allowed-tools: Read, Bash
model: sonnet
user-invocable: true
---

# SQL Optimization

## When to Use

- When queries are running slowly in production or staging
- When designing table schemas that need to scale
- When reviewing ORM-generated queries for inefficiencies
- When adding indexes to improve read performance

## Quick Start

### Identify Slow Queries

```sql
-- Enable query timing
\timing

-- Analyze a specific query
EXPLAIN ANALYZE
SELECT o.id, o.total, u.email
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 50;
```

### Add a Targeted Index

```sql
-- Index on the filter + sort columns
CREATE INDEX idx_orders_status_created
  ON orders(status, created_at DESC)
  WHERE status = 'pending';  -- partial index for common case
```

### Check Existing Index Usage

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;  -- low scan = possibly unused index
```

## Key Strategies

1. **Measure first** — use `EXPLAIN ANALYZE`, not intuition
2. **Covering indexes** — include all SELECT columns to avoid table lookups
3. **Partial indexes** — filter on common WHERE conditions to reduce index size
4. **Avoid SELECT *** — retrieve only needed columns
5. **Batch writes** — use bulk INSERT/UPDATE instead of row-by-row operations

## Common Anti-Patterns

```sql
-- BAD: function on indexed column disables index
WHERE LOWER(email) = 'user@example.com'

-- GOOD: use a functional index or store normalized value
WHERE email = lower('user@example.com')

-- BAD: implicit type cast prevents index use
WHERE user_id = '123'  -- user_id is integer

-- GOOD: match types explicitly
WHERE user_id = 123
```

## Best Practices

- Never optimize without measuring the before/after query time
- Remove indexes that are never used — they slow down writes
- Use `VACUUM ANALYZE` after large bulk operations to update statistics
- Set `work_mem` appropriately for sort-heavy queries
