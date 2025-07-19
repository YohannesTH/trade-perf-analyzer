# Environment Variables and Secrets Configuration Guide

This guide explains how to properly configure all environment variables and secrets needed for the Trading Strategy Backtester deployment.

## Automatic Replit-Provided Secrets

These secrets are automatically provided by Replit when you use their services:

### Database Secrets (Auto-configured)
```
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-postgres-user
PGPASSWORD=your-postgres-password
PGDATABASE=your-database-name
```

### Authentication Secrets (Auto-configured)
```
SESSION_SECRET=automatically-generated-secure-key
REPL_ID=your-repl-project-id
REPLIT_DOMAINS=your-deployment-domain.replit.app
ISSUER_URL=https://replit.com/oidc
```

### System Environment Variables (Auto-configured)
```
NODE_ENV=production (set automatically in deployment)
PORT=5000 (set automatically by Replit)
```

## Manual Configuration Required

### Setting Up Secrets in Replit

1. **Access Secrets Panel**:
   - Open your Replit project
   - Click the lock icon (🔒) in the left sidebar
   - This opens the "Secrets" panel

2. **Add Required Secrets** (if not auto-populated):

   **For Production Deployment**:
   ```
   SESSION_SECRET=your-secure-session-secret-here
   ```

   **For Enhanced Financial Data** (Optional):
   ```
   YAHOO_FINANCE_API_KEY=your-yahoo-finance-api-key
   ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
   POLYGON_API_KEY=your-polygon-io-key
   ```

3. **Verify Secret Configuration**:
   - Secrets should appear in your Secrets panel
   - They are automatically injected as environment variables
   - Never hardcode these values in your code

## Environment Variable Usage in Code

### Backend (Node.js/Express)
```typescript
// Database connection (server/db.ts)
const connectionString = process.env.DATABASE_URL;

// Session configuration (server/replitAuth.ts)
const sessionSecret = process.env.SESSION_SECRET;
const replitDomains = process.env.REPLIT_DOMAINS;

// Server configuration (server/index.ts)
const port = parseInt(process.env.PORT || "5000");
const nodeEnv = process.env.NODE_ENV || "development";
```

### Python Backend (FastAPI)
```python
# server/main.py
import os

# Optional: Enhanced API integrations
YAHOO_API_KEY = os.getenv("YAHOO_FINANCE_API_KEY")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
```

### Frontend (React)
```typescript
// Note: Frontend only has access to VITE_ prefixed variables
// Database and authentication secrets are backend-only for security
```

## Local Development vs Production

### Local Development (.env file - NOT committed to git)
```bash
# Create .env file for local development only
DATABASE_URL=your-local-postgres-url
SESSION_SECRET=local-development-secret
NODE_ENV=development
```

### Production (Replit Secrets)
- All secrets managed through Replit Secrets panel
- Automatically injected at runtime
- Secure and encrypted storage
- No .env file needed in production

## Security Best Practices

### ✅ Do's
- Use Replit Secrets for all sensitive data
- Keep session secrets long and random
- Use different secrets for development vs production
- Regularly rotate API keys
- Use HTTPS in production (automatic with Replit)

### ❌ Don'ts
- Never commit secrets to git
- Don't hardcode API keys in source code
- Don't share secrets in chat/email
- Don't use weak session secrets
- Don't expose database credentials to frontend

## Validating Environment Setup

### Check Database Connection
```bash
# In Replit shell
npm run db:push
```

### Check Authentication Setup
```bash
# Verify environment variables exist
echo $DATABASE_URL
echo $SESSION_SECRET
echo $REPL_ID
```

### Test Application
```bash
# Run in development mode
npm run dev

# Test authentication endpoint
curl https://your-app.replit.dev/api/auth/user
# Should return 401 Unauthorized (correct - means auth is working)
```

## Troubleshooting Environment Issues

### Database Connection Errors
1. Verify `DATABASE_URL` is set and formatted correctly
2. Check database is running and accessible
3. Run `npm run db:push` to ensure schema is up to date

### Authentication Errors
1. Verify `SESSION_SECRET` is set and persistent
2. Check `REPLIT_DOMAINS` matches your deployment domain
3. Ensure `REPL_ID` is correct

### Build/Runtime Errors
1. Check all required secrets are configured
2. Verify Node.js version compatibility
3. Ensure Python dependencies are installed

## API Key Configuration (Optional Extensions)

If you want to extend the application with premium financial data sources:

### Yahoo Finance (Premium)
```bash
# Add to Replit Secrets
YAHOO_FINANCE_API_KEY=your-premium-yahoo-key
```

### Alpha Vantage
```bash
# Add to Replit Secrets  
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
```

### Polygon.io
```bash
# Add to Replit Secrets
POLYGON_API_KEY=your-polygon-key
```

Remember: The current application uses the free Yahoo Finance API through yfinance library, so these premium keys are optional for extended functionality.

## Environment Verification Checklist

Before deploying, ensure:
- [ ] Database connection works (`DATABASE_URL` set)
- [ ] Session management configured (`SESSION_SECRET` set)
- [ ] Authentication domains configured (`REPLIT_DOMAINS` set)
- [ ] Build process completes successfully
- [ ] Both Node.js and Python services start
- [ ] Database schema is up to date
- [ ] All secrets are in Replit Secrets (not hardcoded)

Your environment is now properly configured for secure, scalable deployment!