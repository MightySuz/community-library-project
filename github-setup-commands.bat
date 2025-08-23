@echo off
echo.
echo ============================================
echo   GitHub Setup Commands
echo ============================================
echo.
echo STEP 1: Create repository on GitHub.com first!
echo.
echo STEP 2: Copy and run these commands one by one:
echo.
echo git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
echo git branch -M main
echo git push -u origin main
echo.
echo STEP 3: After pushing, update the homepage in web/package.json:
echo Replace "yourusername" and "community-library" with your actual GitHub username and repository name
echo.
echo STEP 4: Enable GitHub Pages in repository Settings ^> Pages ^> Source: gh-pages branch
echo.
echo STEP 5: Deploy your app:
echo cd web
echo npm run deploy
echo.
echo Your app will be available at: https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME
echo.
pause
