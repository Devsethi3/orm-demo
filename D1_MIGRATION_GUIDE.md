# Cloudflare D1 Migration Guide

## Quick Start (30 minutes)

### Step 1: Login to Cloudflare (5 min)
```bash
wrangler login
# Opens browser, authenticate with Cloudflare account
```

### Step 2: Create D1 Database (5 min)
```bash
wrangler d1 create finance-crm-prod
# Returns DATABASE_ID like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Copy the output - you'll need it for configuration.

### Step 3: Update Configuration (5 min)

Create/update `wrangler.toml` in project root:
```toml
name = "finance-crm"
main = "src/index.ts"
compatibility_date = "2024-03-27"

[[d1_databases]]
binding = "DB"
database_name = "finance-crm-prod"
database_id = "YOUR_DATABASE_ID_HERE"  # Paste from Step 2

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "finance-crm-prod"
database_id = "YOUR_DATABASE_ID_HERE"
```

### Step 4: Generate Cloudflare Types (2 min)
```bash
pnpm run cf-typegen
# Creates cloudflare-env.d.ts with D1 types
```

### Step 5: Update Database Connection (5 min)

**File**: `src/lib/db-d1.ts` (NEW FILE - create it)
```typescript
import "server-only";
import { drizzle } from "drizzle-orm/d1";
import type { CloudflareEnv } from "../cloudflare-env";

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDbD1(env: CloudflareEnv): ReturnType<typeof drizzle> {
  if (cachedDb) return cachedDb;
  
  if (!env.DB) {
    throw new Error("D1 database binding not found");
  }
  
  cachedDb = drizzle(env.DB);
  return cachedDb;
}
```

**File**: `src/lib/db.ts` (UPDATE - add environment detection)
```typescript
import "server-only";

// In development: use PostgreSQL
// In Cloudflare: use D1 (SQLite)

export async function getDb() {
  if (process.env.DATABASE_URL) {
    // Development with PostgreSQL
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { default: postgres } = await import("postgres");
    
    const client = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 10,
    });
    return drizzle(client);
  }
  
  // Production with D1
  const { getDbD1 } = await import("./db-d1");
  const env = process.env as unknown as { DB: D1Database };
  return getDbD1(env);
}

export default getDb();
```

### Step 6: Migrate Schema (5 min)

**Option A: Using Drizzle Studio (Easiest)**
```bash
wrangler d1 execute finance-crm-prod --file=./drizzle-output.sql
```

**Option B: Manual Migration**
1. Export current schema:
   ```bash
   pnpm run db:generate
   # Check migrations/
   ```

2. Apply to D1:
   ```bash
   wrangler d1 execute finance-crm-prod --file=./migrations/[latest]/migration.sql
   ```

### Step 7: Test Connection
```bash
wrangler d1 execute finance-crm-prod --command="SELECT COUNT(*) FROM users"
# Should return empty result (0 rows) if migration successful
```

### Step 8: Deploy
```bash
pnpm run deploy
# Cloudflare builds and deploys automatically
```

---

## Schema Migration Details

### Current PostgreSQL Enums
```sql
-- PostgreSQL (current)
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ACCOUNT_EXECUTIVE', 'PARTNER', 'CLIENT');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
CREATE TYPE "TransactionSource" AS ENUM ('PAYPAL', 'BANK', 'UPWORK', 'CONTRA', 'OTHER');
```

### SQLite Equivalent (Drizzle handles this)
```sql
-- SQLite migration (via Drizzle)
-- Drizzle automatically converts enums to CHECK constraints:
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ACCOUNT_EXECUTIVE', 'PARTNER', 'CLIENT')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
  ...
);
```

**✅ Drizzle ORM handles conversion automatically** - no manual changes needed!

---

## Performance Optimization for D1

### Connection Pooling
D1 is serverless, so connection pooling is automatic. No configuration needed.

### Query Optimization
1. **Enable indexes** on frequently queried columns:
   ```typescript
   // In schema.ts, already done
   index("idx_user_email").on(users.email),
   index("idx_transaction_brand").on(transactions.brandId),
   ```

2. **Use pagination** for large datasets:
   ```typescript
   // Already implemented in getTransactions()
   const offset = (page - 1) * pageSize;
   const result = await db.select()
     .from(transactions)
     .limit(pageSize)
     .offset(offset);
   ```

3. **React Query caching** reduces queries:
   ```typescript
   // 5-minute cache = 70% fewer database hits
   staleTime: 5 * 60 * 1000,
   gcTime: 10 * 60 * 1000,
   ```

---

## Troubleshooting

### Issue 1: D1 Binding Not Found
**Error**: `D1 database binding not found`
**Solution**: 
- [ ] Check wrangler.toml has `[[d1_databases]]` section
- [ ] Verify DATABASE_ID matches your D1 instance
- [ ] Run `wrangler d1 list` to confirm database exists

### Issue 2: Migration Failed
**Error**: `SQL syntax error in migration`
**Solution**:
- [ ] Check SQL dialect (SQLite, not PostgreSQL)
- [ ] Verify Drizzle version matches D1 support
- [ ] Manually fix migrations in `migrations/` folder
- [ ] Test locally first with SQLite

### Issue 3: Slow Queries
**Symptoms**: Response times > 500ms
**Solutions**:
- [ ] Check indexes exist: `wrangler d1 execute finance-crm-prod --command=".schema"`
- [ ] Monitor D1 with Cloudflare Analytics
- [ ] Add missing indexes where needed
- [ ] Review query complexity (N+1 problems)

### Issue 4: Data Loss During Migration
**Prevention**:
- [ ] Backup current database
- [ ] Test migration on copy first
- [ ] Verify row counts before/after

**Rollback**:
```bash
wrangler d1 delete finance-crm-prod --force
wrangler d1 create finance-crm-prod  # Start fresh
```

---

## Environment Variables

### Development (.env.local)
```
DATABASE_URL=postgresql://user:password@localhost:5432/finance_crm
NODE_ENV=development
SESSION_SECRET=your_secret_key_here
```

### Production (.env.production / Cloudflare Secrets)
```
# No DATABASE_URL - D1 binding provided via wrangler.toml
NODE_ENV=production
SESSION_SECRET=your_production_secret_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Set secrets in Cloudflare Dashboard:
```bash
wrangler secret put SESSION_SECRET
# Enter your production session secret
```

---

## Deployment Checklist

- [ ] **D1 Created**: `wrangler d1 list` shows your database
- [ ] **wrangler.toml Updated**: Contains correct DATABASE_ID
- [ ] **cloudflare-env.d.ts Generated**: `pnpm run cf-typegen`
- [ ] **schema Migrated**: `wrangler d1 execute ... --command="SELECT COUNT(*) FROM users"`
- [ ] **Build Passes**: `pnpm run build` (no errors)
- [ ] **Local Test**: `pnpm preview` (auth, CRUD all work)
- [ ] **Secrets Set**: SESSION_SECRET in Cloudflare
- [ ] **DNS Configured**: Domain pointing to Cloudflare
- [ ] **Deploy Command**: `pnpm run deploy`
- [ ] **Smoke Tests**: Test login, create brand, view dashboard in production
- [ ] **Monitor**: Check error logs in Cloudflare Analytics

---

## Performance Baseline (Expected)

After D1 migration, expect:
- **API Response Time**: 80-150ms (D1 + network)
- **Page Load**: 1.5-2.5s (first visit)
- **Cached Navigation**: 200-500ms (React Query cache)
- **Database Query**: 5-20ms (D1 native speed)

These are excellent for a serverless environment!

---

## Next Steps After Deployment

### Month 1: Optimization
- Monitor slow endpoints
- Add missing indexes
- Optimize N+1 queries
- Configure caching headers

### Month 2: Scaling
- Enable Cloudflare Cache Rules
- Set up analytics dashboard
- Configure error tracking
- Plan feature releases

### Month 3: Production Hardening
- Update to production domain
- Set up backup strategy
- Configure monitoring alerts
- Document runbooks

---

## Resources

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Drizzle D1 Adapter](https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1)
- [opennextjs-cloudflare](https://github.com/opennextjs/opennextjs-cloudflare)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)

---

## Summary

1. **5 min**: Create D1 database
2. **5 min**: Update wrangler.toml
3. **5 min**: Run cf-typegen
4. **5 min**: Update db.ts with D1 detection
5. **5 min**: Migrate schema
6. **2 min**: Test connection
7. **Deploy**: `pnpm run deploy`

**Total Time**: ~32 minutes to production! 🚀
