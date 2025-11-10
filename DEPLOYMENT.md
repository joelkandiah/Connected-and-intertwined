# Deployment Guide

This guide explains how to deploy the Connections wedding game to various hosting platforms.

## 📦 Build the Application

First, build the production version:

```bash
npm install
npm run build
```

This creates a `dist/` folder with optimized files ready for deployment.

## 🌐 Deployment Options

### Option 1: GitHub Pages

1. **Enable GitHub Pages in your repository:**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: Select `gh-pages` (you'll create this)

2. **Deploy using GitHub Actions:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install and Build
        run: |
          npm install
          npm run build
          
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. **Or deploy manually:**

```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

### Option 2: Netlify

**Via Netlify UI:**
1. Sign in to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

**Via Netlify CLI:**

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Option 3: Vercel

**Via Vercel UI:**
1. Sign in to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy"

**Via Vercel CLI:**

```bash
npm install -g vercel
npm run build
vercel --prod
```

### Option 4: Firebase Hosting

1. **Install Firebase CLI:**

```bash
npm install -g firebase-tools
```

2. **Initialize Firebase:**

```bash
firebase login
firebase init hosting
```

When prompted:
- Public directory: `dist`
- Configure as SPA: Yes
- Automatic builds: No

3. **Deploy:**

```bash
npm run build
firebase deploy
```

### Option 5: Any Web Server

Simply upload the contents of the `dist/` folder to your web server:

```bash
# Build first
npm run build

# Then upload dist/ contents via FTP, SSH, or hosting panel
# Make sure index.html is served at the root
```

**For Apache:**
Create a `.htaccess` file in the dist folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**For Nginx:**
Add to your nginx config:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 🎨 Custom Domain

After deploying, you can configure a custom domain:

- **GitHub Pages:** Settings → Pages → Custom domain
- **Netlify:** Site settings → Domain management
- **Vercel:** Project settings → Domains
- **Firebase:** `firebase hosting:add`

## 🔄 Continuous Deployment

For automatic deployments on every commit:

1. **GitHub Actions** (for GitHub Pages) - See workflow above
2. **Netlify/Vercel** - Automatically set up when connecting your repo
3. **Firebase** - Use GitHub Actions with Firebase CLI

Example GitHub Action for Firebase:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

## ✅ Verify Deployment

After deployment, check:
- [ ] Site loads correctly
- [ ] All words display in the grid
- [ ] Word selection works
- [ ] Submit button functions
- [ ] LocalStorage persists game state
- [ ] Shuffle button works
- [ ] New Game button resets properly

## 📱 Testing

Test on multiple devices:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS Safari, Chrome Mobile)
- Different screen sizes

Enjoy your deployed Connections game! 🎉
