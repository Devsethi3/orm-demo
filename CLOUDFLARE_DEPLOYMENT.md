# 🚀 Cloudflare Pages Deployment Guide

## Finance CRM - Next.js 16.2.1 on Cloudflare Pages

---

## **Quick Start (3 Steps)**

### **Step 1: Connect Your Git Repository**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pages → Create application → Connect to Git
3. Select your repository (finance-crm)
4. Click "Connect"

### **Step 2: Configure Build Settings**
Set these values in Cloudflare Pages deployment settings:

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `pnpm install && pnpm build` |
| **Build output directory** | `.next` |
| **Node.js version** | `20.x` (or latest) |

### **Step 3: Set Environment Variables**
Add these in Cloudflare Pages **Settings → Environment Variables**:

```
DATABASE_URL = postgresql://...
BETTER_AUTH_SECRET = your-secure-secret-here
EXCHANGE_RATE_API_KEY = your-api-key-here
```

**⚠️ IMPORTANT**: Use "Secret" type for sensitive variables (not "Plain text")

---

## **Environment Variables Reference**

### **Required Variables**

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | `40-char random string` | Generate: `openssl rand -base64 32` |
| `EXCHANGE_RATE_API_KEY` | From exchangerate-api.com | Get free key at https://www.exchangerate-api.com |

### **Optional Variables**
| Variable | Default | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_APP_URL` | Auto-detected | Can override if custom domain |
| `NEXT_PUBLIC_APP_NAME` | "Finance CRM" | Display name in UI |

---

## **Deployment Checklist**

### **Before You Deploy**
- [ ] Repository pushed to GitHub/GitLab
- [ ] `.env` file contains only placeholders (no secrets)
- [ ] `.env.local` is in `.gitignore` (never committed)
- [ ] Build succeeds locally: `pnpm build`
- [ ] All 3 critical fixes applied ✓
  - [ ] No hardcoded auth secrets
  - [ ] No ISR revalidate options
  - [ ] Env vars required at runtime

### **During Deployment**
- [ ] Connect repository to Cloudflare Pages
- [ ] Set build command: `pnpm install && pnpm build`
- [ ] Set output directory: `.next`
- [ ] Add all required environment variables
- [ ] Deploy!

### **After Deployment**
- [ ] Test login page: `https://your-site.pages.dev/login`
- [ ] Test invite link: Use admin panel to send invite
- [ ] Test dashboard: Login and verify all pages load
- [ ] Test databases: Create brands, transactions, etc.
- [ ] Share public link! 🎉

---

## **Managing Secrets Safely**

### **Local Development** (.env.local)
```bash
# This file NEVER goes to Git (it's in .gitignore)
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-secret"
EXCHANGE_RATE_API_KEY="your-key"
```

### **Production** (Cloudflare Dashboard)
```
Cloudflare Pages → Settings → Environment Variables
Type: "Secret" (encrypted)
Add each required environment variable
```

### **Never Do This** ❌
```bash
# DON'T commit real secrets to .env
# DON'T hardcode secrets in code
# DON'T share .env.local files
# DON'T paste secrets in commit messages
```

---

## **Troubleshooting**

### **Build Fails: "Cannot find DATABASE_URL"**
**Solution**: Add `DATABASE_URL` in Cloudflare Pages environment variables

### **Pages Load But Database Operations Fail**
**Solution**: 
1. Verify `DATABASE_URL` is correct
2. Check Neon console for connection limits
3. Verify database user has correct permissions

### **Auth Not Working / Sessions Not Saved**
**Solution**:
1. Verify `BETTER_AUTH_SECRET` is set (non-empty, 32+ chars)
2. Check browser cookies are enabled
3. Verify HTTP-only cookie support in browser

### **"BETTER_AUTH_SECRET is required" Error**
**Solution**: Environment variable is missing or empty in Cloudflare dashboard
- Go to Pages Settings → Environment Variables
- Verify `BETTER_AUTH_SECRET` exists and is non-empty

### **Slow Database Queries**
**Solution**:
- Add connection pooling at Neon: use "pooler" endpoint
- Verify database indexes exist
- Check for N+1 queries in server actions

---

## **Performance Tips**

### **Optimize Database**
1. Use Neon's built-in pooling: `*-pooler.neon.tech`
2. Keep `DATABASE_URL` updated if needing new connections
3. Monitor query performance in Neon dashboard

### **Optimize Edge Functions**
- Keep functions small and focused
- Cache static assets
- Use ISR where possible (though removed for Cloudflare compatibility)

### **Monitor Deployment**
- Check Cloudflare Pages Analytics
- Monitor error logs in Settings → Deployments
- Track build times and optimize if needed

---

## **Testing Your Deployment**

### **Test Checklist**

```bash
# 1. Test Authentication
- Visit /login
- Create account (or use test account)
- Verify session cookie is set

# 2. Test Dashboard
- Login as ADMIN → Verify stats dashboard loads
- Login as ACCOUNT_EXECUTIVE → Verify AE dashboard
- Login as PARTNER → Verify partner page
- Login as CLIENT → Verify client view

# 3. Test Key Features
- Create brand
- Create employee
- Create transaction
- Send invite and accept
- Create partner
- View reports

# 4. Test API
- Open browser DevTools → Network tab
- Verify API calls use correct auth token
- Check response times
```

---

## **Custom Domain Setup** (Optional)

### **Add Custom Domain**
1. Pages → finance-crm → Custom domains
2. Click "Add custom domain"
3. Enter your domain (e.g., `crm.example.com`)
4. Follow DNS instructions
5. Update `NEXT_PUBLIC_APP_URL` to your domain

### **SSL/TLS**
- Cloudflare automatically provides free SSL
- Redirect HTTP → HTTPS automatically

---

## **Monitoring & Maintenance**

### **Daily Checks**
- [ ] Check Cloudflare Pages dashboard for errors
- [ ] Monitor database query performance
- [ ] Verify recent deployments succeeded

### **Weekly Checks**
- [ ] Review analytics for usage patterns
- [ ] Check error logs for new issues
- [ ] Test critical user flows

### **Monthly Checks**
- [ ] Review and rotate API keys
- [ ] Update dependencies
- [ ] Check for security updates

---

## **Deployment Commands**

### **Manual Deployment** (if not using Git integration)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy .next --project-name=finance-crm
```

### **CI/CD Pipeline** (GitHub Actions)
```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: cloudflare/pages-action@1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: finance-crm
          directory: .next
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

## **Getting Help**

- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Next.js on Cloudflare**: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- **Neon Database**: https://neon.tech/docs/
- **Support**: Contact Cloudflare support at https://dash.cloudflare.com/support

---

## **Final Checklist Before Production**

- [x] Build succeeds
- [x] No hardcoded secrets
- [x] Secrets managed securely
- [x] Database connected
- [x] Auth working locally
- [ ] Environment variables set in Cloudflare
- [ ] Deployed to Cloudflare Pages
- [ ] Public link tested
- [ ] All features working
- [ ] Ready to share! 🎉

---

**You're ready to deploy!** Follow the Quick Start section above to get your app live on Cloudflare Pages.
