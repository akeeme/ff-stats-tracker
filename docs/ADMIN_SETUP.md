# Admin Access Setup Guide

This application now supports **view-only mode for friends** and **admin mode for you**. Here's how to set it up and use it.

---

## 🔐 How It Works

- **Without admin key**: Users see a clean, read-only interface (no edit buttons, no create forms)
- **With admin key**: You get full access to create, edit, and delete everything
- **Single deployment**: One URL serves both modes - no need for separate deployments

---

## 🚀 Quick Setup

### 1. Set Your Admin Secret Key

Add this to your `.env` file (backend):

```bash
ADMIN_SECRET_KEY=your-super-secret-password-here
```

**Important**: 
- Choose a strong, random password
- Keep this secret - don't share it with friends
- If you don't set this, the app runs in "development mode" (no protection)

### 2. Deploy Your Application

Deploy to your hosting platform (Vercel, Netlify, Railway, etc.) and make sure to set the `ADMIN_SECRET_KEY` environment variable in your deployment settings.

### 3. Access as Admin

**Option A - URL Parameter (Easiest)**
```
https://your-app.com?admin=your-super-secret-password-here
```

The app will:
- Save the admin key to your browser's localStorage
- Remove the key from the URL (for security)
- Show you the admin interface with all edit capabilities

**Option B - Bookmark**
Create a bookmark with the admin URL so you can quickly access admin mode.

### 4. Share with Friends

Give your friends the regular URL:
```
https://your-app.com
```

They'll see:
- ✅ All stats, standings, teams, players, games
- ✅ Beautiful, clean interface
- ❌ No edit buttons or forms
- ❌ Cannot modify any data

---

## 📱 Admin Features

When logged in as admin, you'll see:

### Visual Indicators
- **Green "Admin" badge** in the header with logout button
- **All edit/delete buttons** visible on cards
- **Create forms** for teams, players, games, stats
- **Season management** page visible in navigation
- **Stat entry** page visible in navigation

### Protected Operations
All of these require admin access:
- Creating teams, players, games, stats
- Editing any existing data
- Deleting records
- Ending seasons
- Copying teams to new seasons

---

## 🔄 Switching Modes

### To Logout (Switch to Viewer Mode)
Click the **"Logout"** button next to the Admin badge in the header.

### To Login Again
Visit the URL with the admin parameter again:
```
https://your-app.com?admin=your-super-secret-password-here
```

---

## 🛡️ Security Notes

### Backend Protection
- All write operations (POST, PUT, DELETE) are protected by middleware
- The backend checks the `X-Admin-Key` header on every write request
- Even if someone inspects the frontend code, they cannot bypass backend validation

### Frontend Protection
- Admin key is stored in browser's localStorage
- Key is automatically included in all API requests
- UI elements are conditionally rendered based on admin status

### Best Practices
1. **Use a strong admin key** - at least 20 random characters
2. **Don't share the admin URL** - only give friends the regular URL
3. **Change the key periodically** if you suspect it's been compromised
4. **Use HTTPS** in production to encrypt the admin key in transit

---

## 🐛 Troubleshooting

### "Admin access required" error when trying to edit
- Make sure you've accessed the app with the admin parameter
- Check that your admin key matches the `ADMIN_SECRET_KEY` in your backend
- Try logging out and logging in again

### Friends can see edit buttons
- Make sure they're accessing the regular URL (without admin parameter)
- Have them clear their browser's localStorage and refresh
- Check that they haven't accidentally bookmarked the admin URL

### Backend allows all edits (no protection)
- Verify `ADMIN_SECRET_KEY` is set in your backend environment variables
- Restart your backend server after setting the environment variable
- Check the backend logs to confirm the middleware is running

---

## 📝 Example Workflow

### For You (Admin)
1. Bookmark: `https://your-app.com?admin=your-secret-key`
2. Click bookmark to access admin mode
3. Create teams, enter stats, manage seasons
4. Admin badge shows you're logged in

### For Friends (Viewers)
1. Visit: `https://your-app.com`
2. View standings, stats, team records
3. Clean interface with no clutter
4. Cannot modify anything

---

## 🔧 Development Mode

If `ADMIN_SECRET_KEY` is not set, the app runs in development mode:
- All requests are allowed (no admin check)
- Useful for local development
- **Never deploy to production without setting the admin key!**

---

## 📞 Need Help?

If you run into issues:
1. Check the browser console for errors
2. Check the backend logs for authentication failures
3. Verify environment variables are set correctly
4. Make sure you're using the correct admin key

---

## 🎉 You're All Set!

Your app is now ready to share with friends. They'll enjoy a clean viewing experience while you maintain full control over your data.
