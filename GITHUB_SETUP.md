# GitHub Setup for npm run deploy

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `community-library-project` (or your preferred name)
   - **Description**: "Community Library App - React web app for research participants"
   - **Visibility**: Choose Public (required for GitHub Pages)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

```bash
# Add the GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Rename the default branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

**Replace YOUR_USERNAME and YOUR_REPOSITORY_NAME with your actual GitHub username and repository name.**

## Step 3: Configure GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select "gh-pages" branch and "/ (root)" folder
6. Click "Save"

## Step 4: Deploy Your App

Once GitHub is set up, you can deploy using:

```bash
cd "C:\Users\sujaj\Documents\GitHub\Community Library Project\web"
npm run deploy
```

This will:
1. Build your React app
2. Create/update the gh-pages branch
3. Deploy to GitHub Pages
4. Your app will be available at: https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME

## Troubleshooting

- If you get permission errors, you may need to set up SSH keys or use a personal access token
- Make sure your repository is public for GitHub Pages to work
- It may take a few minutes for your site to be available after first deployment

## Quick Commands Reference

```bash
# Check git status
git status

# Add changes
git add .

# Commit changes
git commit -m "Update app"

# Push to GitHub
git push

# Deploy to GitHub Pages
cd web && npm run deploy
```
