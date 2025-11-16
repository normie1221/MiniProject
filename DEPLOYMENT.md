# Deployment Guide - AI Finance Manager Backend

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon, Supabase, or self-hosted)
- Clerk account for authentication
- Git repository (optional)

---

## Step 1: Environment Setup

### 1.1 Create Neon Database
1. Go to https://neon.tech and create an account
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@host/db`)

### 1.2 Setup Clerk Authentication
1. Go to https://clerk.com and create an account
2. Create a new application
3. Copy the **Publishable Key** and **Secret Key** from the API Keys section
4. (Optional) Setup webhook in Clerk dashboard:
   - Go to Webhooks section
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Select events: `user.created`, `user.updated`
   - Copy the **Signing Secret**

### 1.3 Generate Encryption Key
```bash
# Generate a random 32-byte key in base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 1.4 Create .env.local file
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Neon Database
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Encryption
ENCRYPTION_KEY="YOUR_32_BYTE_BASE64_KEY_HERE"

# NextAuth
NEXTAUTH_SECRET="generate_random_string_here"
```

---

## Step 2: Install & Build

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database with test data
# Create a seed.ts file if needed

# Build for production
npm run build
```

---

## Step 3: Deployment Options

### Option A: Deploy to Vercel (Recommended)

#### Prerequisites
- Vercel account
- GitHub repository with your code

#### Steps
1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/finance-manager.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Framework Preset: Next.js
   - Root Directory: `./`

3. **Configure Environment Variables**
   In Vercel dashboard, add all variables from `.env.local`:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `ENCRYPTION_KEY`
   - `NEXTAUTH_SECRET`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your API will be live at `https://your-project.vercel.app/api`

5. **Update Clerk Webhook**
   - Go to Clerk dashboard → Webhooks
   - Update webhook URL to: `https://your-project.vercel.app/api/webhooks/clerk`

#### Vercel Build Settings
```json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next",
  "installCommand": "npm install --legacy-peer-deps"
}
```

---

### Option B: Deploy to Railway

1. **Create Railway account**: https://railway.app

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL database** (if not using Neon)
   - Click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will generate `DATABASE_URL` automatically

4. **Configure environment variables**
   Add all variables from `.env.local` in Railway dashboard

5. **Deploy**
   Railway will automatically build and deploy

---

### Option C: Deploy to Render

1. **Create Render account**: https://render.com

2. **Create new Web Service**
   - Select "New" → "Web Service"
   - Connect GitHub repository
   - Name: `finance-manager-api`
   - Environment: `Node`
   - Build Command: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
   - Start Command: `npm start`

3. **Add PostgreSQL database** (if not using Neon)
   - Create "New" → "PostgreSQL"
   - Connect to Web Service
   - DATABASE_URL will be added automatically

4. **Add environment variables**
   In "Environment" tab, add all variables from `.env.local`

5. **Deploy**

---

### Option D: Self-Hosted (Docker)

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Create docker-compose.yml (with PostgreSQL)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/financedb
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: financedb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

#### Deploy
```bash
# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f app
```

---

## Step 4: Post-Deployment

### 4.1 Verify Deployment
```bash
# Test health endpoint
curl https://your-domain.com/api/hello

# Expected response:
# {"message":"AI Finance Manager Backend — Hello"}
```

### 4.2 Test Authentication
1. Create a Clerk user in the Clerk dashboard
2. Get a session token from Clerk
3. Test protected endpoint:
```bash
curl https://your-domain.com/api/dashboard \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### 4.3 Setup Monitoring (Optional)

#### Add Sentry for Error Tracking
```bash
npm install @sentry/nextjs
```

Create `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
})
```

#### Add Vercel Analytics
Already included if deployed on Vercel!

---

## Step 5: Database Maintenance

### Backup Database (Neon)
Neon provides automatic backups. Configure retention in dashboard.

### Run Migrations
```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### View Database
```bash
# Open Prisma Studio
npx prisma studio
```

---

## Troubleshooting

### Build Errors

**Error: Cannot find module '@prisma/client'**
```bash
npx prisma generate
```

**Error: Peer dependency conflicts**
```bash
npm install --legacy-peer-deps
```

**Error: Database connection failed**
- Verify DATABASE_URL is correct
- Check if database allows external connections
- Ensure SSL is enabled for Neon: `?sslmode=require`

### Runtime Errors

**401 Unauthorized on all endpoints**
- Verify Clerk keys are correct
- Check if Clerk middleware is enabled
- Ensure Authorization header is present

**Webhook signature verification fails**
- Verify CLERK_WEBHOOK_SECRET matches Clerk dashboard
- Check webhook endpoint URL is correct
- Ensure raw body parsing is disabled

---

## Performance Optimization

### 1. Enable Caching
Add Redis for caching:
```bash
npm install ioredis
```

### 2. Database Connection Pooling
Update DATABASE_URL:
```
postgresql://user:pass@host/db?pgbouncer=true&connection_limit=10
```

### 3. Add Compression
Install compression middleware:
```bash
npm install compression
```

### 4. CDN for Reports
Store generated reports in S3 or Cloudflare R2

---

## Scaling Strategies

### Horizontal Scaling
1. Deploy multiple instances
2. Use load balancer (AWS ALB, Cloudflare)
3. Enable session affinity if needed

### Vertical Scaling
1. Increase CPU/Memory on hosting platform
2. Upgrade database plan
3. Enable connection pooling

### Background Jobs
Add job queue for:
- Scheduled predictions
- Report generation
- Fraud detection scans

Recommended: BullMQ with Redis

---

## Security Checklist

- ✅ Environment variables secured (not in code)
- ✅ HTTPS enabled (automatic on Vercel/Railway/Render)
- ✅ Clerk authentication on all protected routes
- ✅ Database credentials encrypted
- ✅ Webhook signature verification enabled
- ✅ CORS configured (if needed for frontend)
- ✅ Rate limiting (add in production)
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Prisma handles this)

---

## Cost Estimation

### Free Tier (Development)
- Vercel: Free (Hobby plan)
- Neon: Free (5GB storage, 1 project)
- Clerk: Free (10,000 MAUs)
- **Total: $0/month**

### Production (Small Scale)
- Vercel Pro: $20/month
- Neon Scale: $19/month (10GB storage)
- Clerk Pro: $25/month (up to 10,000 MAUs)
- **Total: ~$64/month**

### Production (Medium Scale)
- Vercel Enterprise: $150/month
- Neon Business: $69/month (50GB)
- Clerk Production: $99/month (50,000 MAUs)
- Redis (Upstash): $10/month
- **Total: ~$328/month**

---

## Support & Resources

- **Documentation**: See README.md and API_DOCUMENTATION.md
- **Issues**: Create GitHub issues for bugs
- **Clerk Docs**: https://clerk.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://prisma.io/docs

---

**Deployment Status Checklist**

- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Clerk authentication tested
- [ ] Health endpoint responding
- [ ] Protected endpoints require auth
- [ ] Webhook signature verified
- [ ] Tests passing
- [ ] Error monitoring setup
- [ ] Backups configured
- [ ] Domain configured (if custom)

**Ready to deploy!** 🚀
