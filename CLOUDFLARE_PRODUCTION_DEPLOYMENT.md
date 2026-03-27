# Cloudflare Production Deployment Guide (Neon + Workers)

**Status:** Ready for production deployment  
**Database:** Neon PostgreSQL  
**Compute:** Cloudflare Workers  
**Adapter:** opennextjs-cloudflare v1.17.3

---

## Pre-Deployment Checklist

- ✅ Build passes (23.3s, 0 errors)
- ✅ TypeScript strict mode passing  
- ✅ Database connection optimized (10 pool, 30s timeout)
- ✅ Authentication logic simplified (JWT primary)
- ✅ All API routes compiled (15+ endpoints)
- ✅ React Query configured (30+ hooks)
- ✅ wrangler.jsonc updated for production

---

## Step 1: Get Neon Connection String

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create or select your project
3. Click **Connection string**
4. Copy the PostgreSQL connection string:
   ```
   postgresql://user:password@host/dbname?sslmode=require
   ```
5. **Keep this secret** - you'll need it in Step 5

---

## Step 2: Set Cloudflare Project Name

Update `wrangler.jsonc`:

```jsonc
"name": "finance-crm"  // Your actual project name (change from "demo")
```

Then update the service binding:

```jsonc
"services": [
  {
    "binding": "WORKER_SELF_REFERENCE",
    "service": "finance-crm"  // Must match name above
  }
]
```

---

## Step 3: Configure Production Environment

Update `wrangler.jsonc` with your Neon connection:

```jsonc
"env": {
  "production": {
    "vars": {
      "DATABASE_URL": "postgresql://user:password@host/dbname?sslmode=require"
    },
    "secrets": [
      "BETTER_AUTH_SECRET",
      "EXCHANGE_RATE_API_KEY"
    ]
  }
}
```

---

## Step 4: Add Secrets to Cloudflare

Run these commands to add secrets (this is how Cloudflare handles sensitive env vars):

```powershell
# Login to Cloudflare
pnpm exec wrangler secret put BETTER_AUTH_SECRET --env production

# Paste your secret value (from .env.local), press Enter

# Repeat for other secrets
pnpm exec wrangler secret put EXCHANGE_RATE_API_KEY --env production
```

**Get values from .env.local:**
- `BETTER_AUTH_SECRET` - Random 32-char secret used for JWT signing
- `EXCHANGE_RATE_API_KEY` - Your API key for currency conversion

---

## Step 5: Build for Production

```powershell
pnpm run build
```

**Expected output:**
```
✓ Compiled successfully in 23.3s
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ All routes generated
```

---

## Step 6: Deploy to Cloudflare

```powershell
pnpm run deploy --env production
```

**What this does:**
1. Builds the Next.js app via open-next
2. Generates Cloudflare Worker code
3. Uploads to Cloudflare Workers
4. Deploys to global CDN (200+ edge locations)

**Expected output:**
```
✓ Build successful
✓ Uploading Worker...
✓ Published finance-crm
URL: https://finance-crm.your-account.workers.dev
```

---

## Step 7: Verify Production Deployment

### Test the site:

```powershell
# Visit the deployed site
https://finance-crm.your-account.workers.dev
```

### Test login:
1. Go to `/login`
2. Create account or login
3. Check if dashboard loads

### Check database connection:
```powershell
# View logs
pnpm exec wrangler tail --env production

# You should see queries executing without errors
```

### Verify environment variables:
```powershell
# List configured variables
pnpm exec wrangler env list --env production
```

---

## Step 8: Connect Custom Domain (Optional)

1. Go to Cloudflare Dashboard
2. Select your domain
3. **Workers** → **Routes**
4. Create route: `finance-crm.yourdomain.com/*` → `finance-crm`
5. Update `wrangler.jsonc`:

```jsonc
"routes": [
  {
    "pattern": "finance-crm.yourdomain.com",
    "zone_name": "yourdomain.com"
  }
]
```

6. Update `BETTER_AUTH_URL` in Cloudflare secrets:
   ```powershell
   pnpm exec wrangler secret put BETTER_AUTH_URL --env production
   # Enter: https://finance-crm.yourdomain.com
   ```

---

## Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Cloudflare Workers (Compute Layer)              │
│  • Next.js 16.2.1 running on Workers Runtime            │
│  • Server Actions for mutations                         │
│  • API routes (15+ endpoints)                           │
│  • Global CDN caching via Cloudflare                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Encrypted connection
                  │
┌─────────────────▼───────────────────────────────────────┐
│           Neon PostgreSQL (Database Layer)              │
│  • Managed PostgreSQL instance                          │
│  • 12 tables with relationships                         │
│  • Auto-scaling compute                                 │
│  • Automated backups                                    │
│  • Point-in-time recovery                              │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Variables Reference

### Production (Cloudflare)
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - JWT signing secret (Cloudflare Secret)
- `BETTER_AUTH_URL` - Your production domain
- `EXCHANGE_RATE_API_KEY` - Currency API key (Cloudflare Secret)
- `NEXT_PUBLIC_APP_URL` - Deployment URL

### Development (Local .env.local)
- All the above with local database
- Used by `pnpm dev` and `pnpm preview`

---

## Monitoring & Maintenance

### View real-time logs:
```powershell
pnpm exec wrangler tail --env production --follow
```

### Database health:
```powershell
# Connect to Neon console
#https://console.neon.tech → Your project → Connection details
```

### Performance:
- Cloudflare Analytics → Your Workers
- Response times, errors, requests

---

## Rollback Instructions

If deployment fails:

```powershell
# View recent deployments
pnpm exec wrangler deployments list --env production

# Rollback to previous version
pnpm exec wrangler rollback --env production --message "Rollback reason"
```

---

## Troubleshooting

### "DATABASE_URL is not set" error
**Solution:** Ensure DATABASE_URL is in `wrangler.jsonc` env.production.vars

### "Connection refused" error  
**Solution:** Check Neon IP allowlist includes Cloudflare IP ranges

### "SSL error" on database
**Solution:** Ensure connection string has `?sslmode=require`

### 500 errors after deploy
**Solution:** Check logs with `wrangler tail --env production`

---

## Next Steps

1. ✅ Deploy to production
2. Set up monitoring (Sentry, LogRocket optional)
3. Configure backup strategy (Neon handles this)
4. Set up custom domain
5. Monitor performance metrics
6. Plan database scaling if needed

---

## Support Resources

- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **Neon Docs:** https://neon.tech/docs
- **Next.js Docs:** https://nextjs.org/docs
- **open-next:** https://opennext.js.org/

---

**Last Updated:** March 27, 2026  
**Status:** Production Ready ✅
