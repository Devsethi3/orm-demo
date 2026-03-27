# Cloudflare Deployment Fix - Complete Guide

## Problem
The error `Dynamic require of "/.next/server/middleware-manifest.json" is not supported` occurs because Next.js attempts to dynamically load the middleware manifest at runtime, which is incompatible with Cloudflare Workers' static module bundling.

## Root Cause
- Cloudflare Workers bundles all code statically—dynamic `require()` calls are forbidden
- Next.js generates middleware-manifest.json even when no middleware exists  
- The compiled handler code tries to require this at runtime

## Solutions Applied

### 1. ✅ Created Minimal Middleware (`src/middleware.ts`)
A lightweight, Cloudflare-compatible middleware that:
- Prevents the "missing middleware" error from Next.js
- Uses minimal logic to reduce bundler overhead
- Passes all requests through without modification
- Properly configured with a matcher to avoid excessive processing

### 2. ✅ Updated Next.js Configuration (`next.config.ts`)
Added webpack and compatibility settings:
- Configured webpack for proper async module handling
- Disabled unnecessary source maps for production
- Ensures consistent module resolution on edge runtime

### 3. ✅ Verified Cloudflare Configuration (`wrangler.jsonc`)
Confirmed settings:
- `nodejs_compat` flag enabled for Node.js API support
- `.open-next/assets` directory bound for static files
- Environment variables correctly configured

## Deployment Steps

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Set Environment Variables
Create or update `.env.local`:
```bash
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-32-character-secret-key"
BETTER_AUTH_URL="https://your-domain.com"
```

### Step 3: Build Locally
```bash
pnpm build
```

Expected output:
- ✅ `✓ Compiled successfully` message
- ✅ No webpack errors or warnings
- ✅ `.open-next/` directory created with build artifacts

### Step 4: Deploy to Cloudflare
```bash
# Option A: Using Wrangler CLI
pnpm deploy

# Option B: Direct Cloudflare Pages deployment
# Push to your Git repository, Cloudflare will auto-deploy
```

### Step 5: Configure Cloudflare Environment
After deployment, set environment variables in Cloudflare Dashboard:

1. Go to **Pages** > **finance-crm** > **Settings**
2. **Environment variables** section
3. Add:
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `BETTER_AUTH_SECRET` = Your 32+ character secret
   - `BETTER_AUTH_URL` = Your deployed domain

### Step 6: Verify Deployment
```bash
# Test the deployed application
curl https://finance-crm.your-domain.com/

# Check authentication endpoint
curl https://finance-crm.your-domain.com/api/auth/signup
```

## Testing Checklist

- [ ] Local build succeeds (`pnpm build`)
- [ ] TypeScript compilation passes
- [ ] No webpack warnings in build output
- [ ] Cloudflare deployment succeeds
- [ ] Page loads without "Dynamic require" error
- [ ] Authentication endpoints respond (200 OK)
- [ ] Database queries work (test with `/api/...` endpoints)

## Troubleshooting

### Build Still Fails with "Dynamic require" Error
**Solution:** Clear build cache and rebuild:
```bash
rm -rf .next .open-next
pnpm build
```

### Middleware Not Loading
**Verify:** Check that `src/middleware.ts` exists and has proper exports:
```bash
ls -la src/middleware.ts
```

### Database Connection Failed at Runtime
**Check:**
1. Confirm `DATABASE_URL` is set in Cloudflare environment
2. Verify Neon database credentials and firewall rules
3. Ensure your IP/region has database access

### Still Getting Dynamic Require Errors
**Advanced Fix:** Check if imported modules have dynamic requires:
```bash
grep -r "require.*manifest\|dynamic.*require" .next/server --include="*.js" | head -5
```

## Technical Details

### Why Middleware is Needed
- Next.js v16 generates middleware-manifest.json during build
- Without middleware.ts, Next.js can't determine middleware structure
- With an empty middleware, the manifest is static and can be bundled safely

### Cloudflare Workers Compatibility
- Only static, synchronous module loading supported
- All dependencies must be bundled at build time
- No runtime `require()`, `eval()`, or dynamic imports
- Environment variables must be explicitly declared

### Database Configuration  
- **No WebSocket/TCP**—uses HTTP-only driver (postgres-js with Neon)
- **Drizzle ORM**—fully compatible, no transaction support needed
- **Better-auth**—works with HTTP requests only

## Performance Notes
- First deployment may take 3-5 minutes for Cloudflare build
- Subsequent deployments are faster (incremental builds)
- Static assets cached at edge (200ms global latency)
- Database queries depend on Neon + your network latency

## Additional Resources
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [OpenNextJS Cloudflare Integration](https://opennext.js.org/cloudflare/)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Neon Database HTTP API](https://neon.tech/docs/reference/http-api)
