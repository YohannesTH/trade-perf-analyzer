# Trading Strategy Backtester - Replit Deployment Guide

This guide walks you through deploying the full-stack Trading Strategy Backtester application using Replit Deployments.

## Overview

The application consists of:
- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Node.js/Express server with authentication
- **Python Service**: FastAPI for backtesting computations
- **Database**: PostgreSQL with Replit Auth integration
- **Session Storage**: PostgreSQL-based session management

## Prerequisites

1. A Replit account with deployment access
2. The application code in a Replit project
3. PostgreSQL database provisioned in Replit

## Step 1: Configure Environment Variables (Replit Secrets)

Before deployment, you need to set up the following secrets in your Replit project:

### Required Secrets

1. **Database Configuration** (automatically provided by Replit):
   - `DATABASE_URL` - PostgreSQL connection string
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual database credentials

2. **Authentication Secrets** (automatically provided by Replit):
   - `SESSION_SECRET` - Session encryption key
   - `REPL_ID` - Your Replit project ID
   - `REPLIT_DOMAINS` - Deployment domain(s)
   - `ISSUER_URL` - OpenID Connect issuer (defaults to https://replit.com/oidc)

3. **Optional API Keys** (if extending the application):
   - `YAHOO_FINANCE_API_KEY` - For enhanced market data (if using premium Yahoo Finance API)
   - Any other financial data service API keys

### Setting Up Secrets

1. Go to your Replit project
2. Click on "Secrets" in the left sidebar (lock icon)
3. Add the required secrets listed above
4. Replit will automatically provide database and authentication secrets when you use their services

## Step 2: Configure Build Settings

Create or update the `.replit` file in your project root:

```toml
[deployment]
build = ["npm", "run", "build"]
run = ["npm", "start"]
deploymentTarget = "cloudrun"

[nix]
channel = "stable-23_11"

[[ports]]
localPort = 5000
externalPort = 80
```

## Step 3: Verify Build Configuration

The project is already configured with the correct build scripts. Your `.replit` file contains:

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[[ports]]
localPort = 5000
externalPort = 80

[[ports]]
localPort = 8001
externalPort = 3000
```

The build process uses these scripts:
- `npm run build` - Builds both client and server
- `npm run start` - Starts the production server
- `npm run db:push` - Updates database schema

## Step 4: Production Configuration

### Server Configuration Updates

Ensure your server is configured for production in `server/index.ts`:

```typescript
const port = parseInt(process.env.PORT || "5000");
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

app.listen(port, host, () => {
  console.log(`Server running on ${host}:${port}`);
});
```

### Database Initialization

Make sure database tables are created before deployment:

```bash
npm run db:push
```

## Step 5: Deploy to Replit

### Method 1: Using Replit UI

1. **Prepare for Deployment**:
   - Ensure all code is saved and working locally
   - Run `npm run build` to test the build process
   - Verify all secrets are configured

2. **Deploy**:
   - Click the "Deploy" button in the Replit header
   - Choose "Create Deployment"
   - Configure deployment settings:
     - **Name**: `trading-backtester` (or your preferred name)
     - **Description**: "Full-stack trading strategy backtesting platform"
     - **Build Command**: `npm run build`
     - **Run Command**: `npm start`

3. **Configure Resources**:
   - **CPU**: 1-2 vCPUs (recommended for Python backtesting workload)
   - **Memory**: 2-4 GB RAM
   - **Storage**: 10 GB (sufficient for application and database)

4. **Environment Variables**:
   - Replit will automatically inject your configured secrets
   - Verify `NODE_ENV=production` is set

### Method 2: Using Replit CLI

```bash
# Install Replit CLI
npm install -g @replit/cli

# Login to Replit
replit login

# Deploy from project directory
replit deploy
```

## Step 6: Post-Deployment Configuration

### 1. Database Setup

After deployment, ensure your database schema is up to date:

```bash
# Run database migrations
npm run db:push
```

### 2. Health Checks

Verify these endpoints are working:
- `GET /` - Main application
- `GET /api/auth/user` - Authentication endpoint (should return 401 when not logged in)
- `POST /api/backtest` - Backtesting endpoint (requires authentication)

### 3. SSL Configuration

Replit Deployments automatically provide HTTPS certificates. Ensure your authentication callbacks use HTTPS URLs.

## Step 7: Monitoring and Maintenance

### Logging

Monitor your application through Replit's deployment dashboard:
- View real-time logs
- Monitor resource usage
- Track request metrics

### Scaling

If you need to handle more concurrent users:
1. Increase CPU/Memory resources in deployment settings
2. Consider optimizing Python backtesting for parallel processing
3. Implement request caching for frequent backtests

### Updates

To deploy updates:
1. Make changes to your code
2. Test locally with `npm run dev`
3. Redeploy through Replit UI or CLI

## Common Issues and Solutions

### 1. Build Failures

**Issue**: TypeScript compilation errors
**Solution**: 
```bash
npm run type-check
npm run build:client
npm run build:server
```

### 2. Authentication Issues

**Issue**: Authentication redirects failing
**Solution**: 
- Verify `REPLIT_DOMAINS` includes your deployment domain
- Ensure `SESSION_SECRET` is set and persistent
- Check HTTPS configuration

### 3. Database Connection Issues

**Issue**: Cannot connect to PostgreSQL
**Solution**:
- Verify `DATABASE_URL` is correctly formatted
- Ensure database tables exist (`npm run db:push`)
- Check database resource limits

### 4. Python Backend Issues

**Issue**: FastAPI service not starting
**Solution**:
- Verify Python dependencies in `server/requirements.txt`
- Check port conflicts (FastAPI runs on 8001, Express on 5000)
- Monitor Python service logs

## Security Best Practices

1. **Environment Variables**: Never commit secrets to code
2. **Authentication**: Replit Auth provides secure OAuth flows
3. **Database**: Use connection pooling and prepared statements
4. **HTTPS**: Always use HTTPS in production (provided by Replit)
5. **Session Security**: Sessions stored in PostgreSQL, not memory

## Performance Optimization

1. **Frontend**: 
   - Static assets served efficiently by Vite build
   - Code splitting for optimal loading

2. **Backend**:
   - Connection pooling for database
   - Efficient query patterns with Drizzle ORM

3. **Python Service**:
   - Optimize pandas operations for large datasets
   - Consider caching frequently requested backtests

## Backup and Recovery

1. **Database Backups**: 
   - Replit provides automated PostgreSQL backups
   - Export critical data regularly for additional safety

2. **Code Backup**:
   - Keep code in version control (Git)
   - Tag releases for easy rollback

## Cost Optimization

1. **Resource Sizing**: Start with smaller instances and scale up as needed
2. **Monitoring**: Use Replit's resource monitoring to optimize usage
3. **Caching**: Implement result caching for expensive backtests

## Support and Troubleshooting

If you encounter issues:
1. Check Replit deployment logs
2. Verify all environment variables are set
3. Test individual components (frontend, Express, Python, database)
4. Contact Replit support for deployment-specific issues

Your Trading Strategy Backtester is now ready for production use with full authentication, database persistence, and scalable architecture!