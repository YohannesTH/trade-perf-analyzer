# Quick Deployment Guide - Trading Strategy Backtester

Follow this step-by-step guide to deploy your Trading Strategy Backtester to Replit Deployments in under 10 minutes.

## 🚀 Quick Start Deployment

### Step 1: Prepare Your Project (2 minutes)

1. **Verify Build Works**:
   ```bash
   npm run build
   ```
   ✅ Should see "✓ built in" message with no errors

2. **Update Database Schema**:
   ```bash
   npm run db:push
   ```
   ✅ Should see "✓ Changes applied" message

3. **Test Local Development**:
   ```bash
   npm run dev
   ```
   ✅ Should see both Express and Python services running

### Step 2: Configure Secrets (3 minutes)

1. **Open Secrets Panel**:
   - Click the lock icon (🔒) in the left sidebar
   - This opens your project's Secrets management

2. **Verify Auto-Generated Secrets**:
   These should already exist (auto-created by Replit):
   ```
   DATABASE_URL
   SESSION_SECRET  
   REPL_ID
   REPLIT_DOMAINS
   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
   ```

3. **Add Optional Secrets** (if needed):
   ```
   YAHOO_FINANCE_API_KEY=your-api-key-here
   ```

### Step 3: Deploy to Replit (5 minutes)

1. **Start Deployment**:
   - Click the **"Deploy"** button in the top-right corner
   - Select **"Create New Deployment"**

2. **Configure Deployment Settings**:
   ```
   Name: trading-backtester
   Description: Full-stack trading strategy backtester
   Build Command: npm run build
   Run Command: npm run start
   ```

3. **Select Resources**:
   - **CPU**: 2 vCPUs (recommended for Python computations)
   - **Memory**: 2-4 GB RAM
   - **Region**: Choose closest to your users

4. **Deploy**:
   - Click **"Deploy"**
   - Wait for build process (2-3 minutes)
   - Deployment will show "Live" status when ready

## ✅ Verification Checklist

After deployment, verify these work:

- [ ] **Landing Page**: Visit your deployment URL
- [ ] **Authentication**: Click "Get Started - Sign In"
- [ ] **Database**: User data saves after login
- [ ] **Backtesting**: Run a test backtest (AAPL, SMA strategy)
- [ ] **Results**: View performance charts and metrics

## 🔧 Configuration Details

### Build Process
Your `.replit` file is pre-configured with:
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

### Port Configuration
```toml
[[ports]]
localPort = 5000    # Main application
externalPort = 80   # Public access

[[ports]] 
localPort = 8001    # Python API
externalPort = 3000 # Internal communication
```

### Environment Variables
All secrets are automatically injected by Replit:
- Database connection via `DATABASE_URL`
- Authentication via Replit Auth system
- Session management via `SESSION_SECRET`

## 🌐 Accessing Your Deployed App

1. **Get Your URL**:
   - Your app will be available at: `https://your-repl-name.your-username.replit.app`
   - Or your custom domain if configured

2. **Test the Flow**:
   - Visit the landing page (logged out users)
   - Click "Get Started - Sign In" 
   - Sign in with your Replit account
   - Access the backtesting interface
   - Run a sample backtest

## 🔄 Updates and Maintenance

### Deploying Updates
1. Make changes to your code
2. Test locally with `npm run dev`
3. Redeploy via the Replit Deploy button
4. Updates deploy automatically

### Monitoring
- View logs in the Deployment dashboard
- Monitor resource usage and performance
- Track user authentication events

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build locally first
npm run build
npm run start
```

### Authentication Issues
- Verify `REPLIT_DOMAINS` includes your deployment domain
- Check `SESSION_SECRET` is set and persistent

### Database Issues  
```bash
# Recreate database schema
npm run db:push
```

### Python Service Issues
- Ensure `server/requirements.txt` has all dependencies
- Verify FastAPI starts on port 8001

## 📊 Expected Performance

### Load Times
- Landing page: < 2 seconds
- Authentication: < 3 seconds  
- Backtesting: 5-15 seconds (depending on data range)

### Concurrent Users
- Supports 100+ concurrent users
- Auto-scaling handles traffic spikes
- Database connection pooling prevents bottlenecks

## 🔐 Security Features

✅ **Production Ready Security**:
- HTTPS encryption (automatic)
- Secure session management
- Authentication via Replit Auth
- Environment variables secured
- Database credentials protected
- CSRF protection enabled

## 🎯 Success Metrics

Your deployment is successful when:
- [ ] Landing page loads without errors
- [ ] Users can sign in with Replit Auth
- [ ] Backtests run and return results
- [ ] Results are saved to user's account
- [ ] Performance charts render correctly
- [ ] Application handles multiple concurrent users

## 🚀 Going Live

Your Trading Strategy Backtester is now:
- **Publicly accessible** at your Replit domain
- **Automatically scaled** to handle user demand
- **Secured** with enterprise-grade authentication
- **Persistent** with PostgreSQL database storage
- **Monitored** with built-in Replit analytics

**Congratulations! Your trading backtester is now live and ready for users! 🎉**

---

For detailed configuration and troubleshooting, see the full `DEPLOYMENT.md` guide.