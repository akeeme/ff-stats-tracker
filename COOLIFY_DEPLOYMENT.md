# Coolify Deployment Guide

This guide will help you deploy the Flag Football Stats Tracker on Coolify with a Go backend, Next.js frontend, and PostgreSQL database.

## 📋 Prerequisites

- A Coolify instance (self-hosted or cloud)
- Git repository with your code (GitHub, GitLab, etc.)
- Self-hosted Supabase instance with PostgreSQL database
- Supabase connection credentials
- Domain name (optional but recommended)

## 🏗️ Architecture Overview

The application consists of two services:
1. **Go Backend API** - RESTful API (Port 8080) - Connects to your self-hosted Supabase PostgreSQL
2. **Next.js Frontend** - User interface (Port 3000)

**Note**: This guide assumes you already have a self-hosted Supabase instance running with PostgreSQL.

## 🚀 Deployment Steps

### Step 1: Create a New Project in Coolify

1. Log into your Coolify dashboard
2. Click **"New Project"**
3. Name it `ff-stats-tracker`

### Step 2: Gather Supabase Connection Details

Before deploying, get your self-hosted Supabase PostgreSQL connection details:

- **DB_HOST**: Your Supabase PostgreSQL hostname (e.g., `db.your-domain.com` or internal IP)
- **DB_PORT**: `5432` (default PostgreSQL port)
- **DB_USER**: `postgres` (default Supabase user)
- **DB_PASSWORD**: Your Supabase PostgreSQL password
- **DB_NAME**: `postgres` (default Supabase database name)
- **DB_SSLMODE**: `require` (Supabase requires SSL by default)

> **Tip**: If your Supabase instance is on the same network as Coolify, use the internal hostname/IP for better performance and security.

### Step 3: Deploy Go Backend

1. In your project, click **"Add Resource"** → **"Application"**
2. Select **"Public Repository"** or connect your Git provider
3. Enter your repository URL
4. Configure the application:
   - **Name**: `ff-stats-backend`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `/Dockerfile` (root)
   - **Port**: `8080`

5. **Set Environment Variables**:
   ```
   DB_HOST=<your-supabase-postgres-hostname>
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=<your-supabase-password>
   DB_NAME=postgres
   DB_SSLMODE=require
   PORT=8080
   ```

   > **Important**: 
   > - Use your self-hosted Supabase PostgreSQL hostname for `DB_HOST`
   > - If Supabase is on the same network, use internal hostname/IP
   > - Set `DB_SSLMODE=require` for Supabase (or `disable` if using internal network without SSL)
   > - Default Supabase database name is `postgres`

6. **Health Check** (Optional but recommended):
   - Path: `/api/teams`
   - Port: `8080`
   - Interval: `30s`

7. Click **"Deploy"**

### Step 4: Deploy Next.js Frontend

1. In your project, click **"Add Resource"** → **"Application"**
2. Select your repository (same as backend)
3. Configure the application:
   - **Name**: `ff-stats-frontend`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `/frontend/Dockerfile`
   - **Base Directory**: `/frontend`
   - **Port**: `3000`

4. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
   ```

   > **Important**: Replace `your-backend-domain.com` with your actual backend domain. If you haven't set up a domain yet, you can use the Coolify-generated URL.

5. Click **"Deploy"**

### Step 5: Configure Domains

#### Backend Domain
1. Go to your backend application in Coolify
2. Navigate to **"Domains"**
3. Add your domain (e.g., `api.yourdomain.com`)
4. Coolify will automatically provision SSL certificates

#### Frontend Domain
1. Go to your frontend application in Coolify
2. Navigate to **"Domains"**
3. Add your domain (e.g., `app.yourdomain.com` or `yourdomain.com`)
4. Coolify will automatically provision SSL certificates

#### Update Frontend Environment Variable
After setting up the backend domain, update the frontend's `NEXT_PUBLIC_API_URL`:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```
Then redeploy the frontend.

## 🔧 Advanced Configuration

### Using Internal Networking with Self-hosted Supabase

For better performance and security when your Supabase is on the same network:

1. Use internal hostname/IP for `DB_HOST` (e.g., `10.0.0.5` or `supabase-postgres`)
2. You may be able to use `DB_SSLMODE=disable` for internal connections
3. Ensure network connectivity between Coolify and Supabase
4. Only the frontend needs to be publicly accessible
5. The backend can be internal-only if you proxy API requests through the frontend

### Environment Variables Reference

#### Backend (.env)
```env
# Self-hosted Supabase PostgreSQL connection
DB_HOST=db.your-supabase-domain.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<your-supabase-password>
DB_NAME=postgres
DB_SSLMODE=require
PORT=8080
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Database Backups

Since you're using self-hosted Supabase, manage backups through your Supabase instance:

1. Use Supabase's built-in backup features
2. Or configure PostgreSQL backups directly (pg_dump, WAL archiving)
3. Recommended: Daily automated backups with 7-30 day retention
4. Store backups in S3 or separate storage location

## 🧪 Testing Your Deployment

### 1. Test Database Connection
```bash
# From the backend container
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### 2. Test Backend API
```bash
# Health check
curl https://api.yourdomain.com/api/teams

# Create a test team
curl -X POST https://api.yourdomain.com/api/teams \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Team", "season": 2024, "league": "Premier"}'
```

### 3. Test Frontend
Visit `https://yourdomain.com` in your browser and verify:
- Page loads correctly
- Can view teams/players
- Can create new records

## 🔍 Troubleshooting

### Backend Can't Connect to Supabase Database

**Issue**: Backend logs show database connection errors

**Solutions**:
1. Verify `DB_HOST` points to your Supabase PostgreSQL instance
2. Check Supabase is accessible from Coolify server: `telnet <DB_HOST> 5432`
3. Verify credentials match your Supabase configuration
4. Check SSL mode: Use `require` for external, `disable` for internal connections
5. Ensure firewall rules allow connection from Coolify to Supabase
6. Verify network connectivity between services
7. Check if database migrations ran successfully

### Frontend Can't Reach Backend

**Issue**: Frontend shows API errors or "Network Error"

**Solutions**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check backend is accessible: `curl https://api.yourdomain.com/api/teams`
3. Verify CORS is enabled in the backend (it is by default)
4. Check browser console for specific errors

### Build Failures

**Issue**: Docker build fails in Coolify

**Solutions**:
1. Check build logs in Coolify
2. Verify Dockerfile paths are correct
3. For frontend: Ensure `next.config.ts` has `output: 'standalone'`
4. For backend: Verify Go version matches `go.mod` (1.21+)

### Database Migrations Not Running

**Issue**: Tables don't exist in database

**Solutions**:
1. Check backend logs for migration errors
2. Manually connect to Supabase database and verify schema
3. The backend runs migrations automatically on startup
4. Verify Supabase PostgreSQL user has CREATE TABLE permissions
5. Check if Supabase has any restrictions on schema modifications
6. You can run migrations manually if needed using the SQL files in `db files/`

## 📊 Monitoring

### Application Logs
- Access logs in Coolify dashboard for each service
- Backend logs show API requests and database operations
- Frontend logs show build and runtime information

### Database Monitoring
- Monitor database size in your Supabase dashboard
- Check connection pool usage in backend logs
- Set up alerts for disk space on Supabase server
- Use Supabase's built-in monitoring tools

### Performance Metrics
- Monitor response times via backend logs
- Use Coolify's built-in metrics
- Consider adding APM tools (e.g., Sentry, DataDog)

## 🔄 Updates and Redeployment

### Automatic Deployments
1. In Coolify, enable **"Auto Deploy"** for your applications
2. Set the branch to watch (e.g., `main`)
3. Coolify will automatically rebuild and deploy on git push

### Manual Deployments
1. Go to your application in Coolify
2. Click **"Deploy"** or **"Redeploy"**
3. Monitor build logs for any errors

### Zero-Downtime Deployments
Coolify supports zero-downtime deployments:
1. New container is built and started
2. Health checks verify it's ready
3. Traffic is switched to new container
4. Old container is stopped

## 🔐 Security Best Practices

1. **Use Strong Passwords**: Generate strong passwords for database
2. **Environment Variables**: Never commit secrets to git
3. **SSL/TLS**: Always use HTTPS (Coolify handles this automatically)
4. **Database Access**: Keep database internal-only
5. **Regular Updates**: Keep dependencies and base images updated
6. **Backups**: Enable automated database backups
7. **Monitoring**: Set up alerts for errors and unusual activity

## 📝 Local Development vs Production

### Local Development
```bash
# Start all services locally (connects to your Supabase)
docker-compose up

# Access:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8080
# - Database: Your Supabase instance
```

### Production (Coolify)
- Backend and frontend run in isolated containers
- Backend connects to your self-hosted Supabase PostgreSQL
- SSL certificates automatically provisioned
- Monitor backups through Supabase

## 🆘 Support

If you encounter issues:

1. Check Coolify documentation: https://coolify.io/docs
2. Review application logs in Coolify dashboard
3. Verify environment variables are set correctly
4. Test Supabase connectivity from backend container: `telnet <DB_HOST> 5432`
5. Check firewall rules between Coolify and Supabase
6. Verify Supabase PostgreSQL is accessible
7. Check DNS settings for custom domains

## 📚 Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Go Deployment](https://go.dev/doc/tutorial/compile-install)

---

**Deployment Checklist**:
- [ ] Self-hosted Supabase PostgreSQL is accessible
- [ ] Supabase connection credentials gathered
- [ ] Network connectivity verified between Coolify and Supabase
- [ ] Backend deployed with correct Supabase environment variables
- [ ] Frontend deployed with correct API URL
- [ ] Domains configured with SSL
- [ ] Supabase database backups configured
- [ ] Application tested end-to-end
- [ ] Monitoring and alerts configured
