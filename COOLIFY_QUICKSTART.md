# Coolify Quick Start

A condensed guide to get your Flag Football Stats Tracker running on Coolify in minutes.

## 🎯 Prerequisites
- Coolify instance running
- Self-hosted Supabase instance with PostgreSQL
- Supabase connection credentials
- Git repository URL
- Domain names (optional)

## 🚀 3-Minute Deployment

### 1. Gather Supabase Details (1 minute)
```
Get from your self-hosted Supabase:
- DB_HOST: Your Supabase PostgreSQL hostname/IP
- DB_PORT: 5432
- DB_USER: postgres
- DB_PASSWORD: Your Supabase password
- DB_NAME: postgres
- DB_SSLMODE: require (or disable for internal)
```

### 2. Backend (1 minute)
```
1. New Resource → Application → Git Repository
2. Name: ff-stats-backend
3. Build Pack: Dockerfile
4. Dockerfile: /Dockerfile
5. Port: 8080
6. Environment Variables:
   DB_HOST=<your-supabase-hostname>
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=<your-supabase-password>
   DB_NAME=postgres
   DB_SSLMODE=require
   PORT=8080
7. Deploy
8. Copy backend URL
```

### 3. Frontend (1 minute)
```
1. New Resource → Application → Same Repository
2. Name: ff-stats-frontend
3. Build Pack: Dockerfile
4. Dockerfile: /frontend/Dockerfile
5. Base Directory: /frontend
6. Port: 3000
7. Environment Variables:
   NEXT_PUBLIC_API_URL=<backend-url>/api
8. Deploy
```

## ✅ Verification

1. **Backend**: Visit `<backend-url>/api/teams` - should return `[]`
2. **Frontend**: Visit `<frontend-url>` - should load the app
3. **Create Test Team**: Use the UI to create a team

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| Backend can't connect to Supabase | Verify `DB_HOST` and check firewall/network |
| SSL connection error | Use `DB_SSLMODE=require` or `disable` for internal |
| Frontend can't reach API | Check `NEXT_PUBLIC_API_URL` is correct |
| Build fails | Check Dockerfile paths and logs |
| Migrations fail | Verify Supabase user has CREATE TABLE permissions |

## 📚 Full Documentation

For detailed instructions, troubleshooting, and advanced configuration, see [COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md).

## 🎉 Next Steps

1. Configure custom domains
2. Set up Supabase backups (if not already configured)
3. Set up monitoring
4. Configure auto-deploy on git push
5. Verify network connectivity between Coolify and Supabase
