@echo off
echo Building Community Library for deployment...
cd web
call npm run build
echo.
echo Build complete! 
echo.
echo Deploy options:
echo 1. Netlify: Go to netlify.com and drag the 'build' folder
echo 2. Vercel: Run 'npx vercel --prod' in the web directory  
echo 3. Firebase: Run 'firebase deploy' in the web directory
echo.
echo The build folder is ready at: web\build
echo.
pause
