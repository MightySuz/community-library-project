# Community Library Prototype - Deployment Guide

## 🚀 Quick Deployment Options

Your Community Library prototype is ready to be deployed! Here are several free hosting options:

### Option 1: Netlify (Recommended - Easiest)
1. **Build the app:**
   ```bash
   cd web
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `web/build` folder to Netlify
   - Get instant URL like: `https://your-app-name.netlify.app`

### Option 2: Vercel
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd web
   vercel --prod
   ```

### Option 3: GitHub Pages
1. **Install gh-pages:**
   ```bash
   cd web
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   "homepage": "https://yourusername.github.io/community-library",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### Option 4: Firebase Hosting
1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize and deploy:**
   ```bash
   cd web
   firebase init hosting
   npm run build
   firebase deploy
   ```

## 📋 Pre-Deployment Checklist

✅ React app builds successfully
✅ _redirects file created for SPA routing
✅ All features working in development
✅ Community isolation working
✅ OTP verification working (demo mode)
✅ Book management working
✅ Mobile responsive design

## 🎯 Research Participant Instructions

Once deployed, share these instructions with participants:

### Demo Accounts:
- **Username:** `john_doe` → Access Green Valley Society books
- **Username:** `sunset_user` → Access Sunset Apartments books  
- **Password:** Any password works for demo

### Features to Test:
1. **Login** with demo accounts
2. **Browse Books** from your community
3. **Add Books** to your collection
4. **Request Books** from other users
5. **Manage Wallet** (requires OTP: 1234)
6. **Delete Books** (requires OTP: 1234)

### Test Scenarios:
- Register new account with different communities
- Add books and see them in "My Books"
- Try cross-community book browsing (should be restricted)
- Test OTP verification for sensitive operations

## 🔧 Customization Options

Before deploying, you can customize:

1. **Branding:** Update colors, logo, app name
2. **Communities:** Add more sample communities
3. **Demo Data:** Add more sample books
4. **Features:** Enable/disable specific functionality

## 📊 Analytics Setup (Optional)

Add Google Analytics to track user interactions:

1. **Add to public/index.html:**
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

## 🚀 Recommended Deployment: Netlify

**Netlify is the easiest option:**

1. Build your app: `npm run build`
2. Drag `build` folder to netlify.com
3. Get shareable URL instantly
4. Free SSL certificate included
5. Form handling available for feedback

**Your URL will be:** `https://community-library-research.netlify.app`

---

## 📞 Support

If you need help with deployment:
1. Check build logs for errors
2. Ensure all dependencies are installed
3. Test locally first: `npm start`
4. Contact for deployment assistance

Happy researching! 🎉
