# Community Library Setup Script for Windows
Write-Host "🚀 Setting up Community Library Development Environment" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running (optional check)
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if (-not $mongoProcess) {
    Write-Host "⚠️  MongoDB might not be running. Please ensure MongoDB is started." -ForegroundColor Yellow
    Write-Host "   You can start it with: net start MongoDB" -ForegroundColor Yellow
}

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
try {
    npm install
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location ../web
try {
    npm install
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing mobile dependencies..." -ForegroundColor Cyan
Set-Location ../mobile
try {
    npm install
    Write-Host "✅ Mobile dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install mobile dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Environment variables are already configured with development defaults"
Write-Host "2. Update the .env files with your actual API keys if needed"
Write-Host ""
Write-Host "3. Start the development servers:" -ForegroundColor Yellow
Write-Host "   Backend:  cd backend && npm run dev" -ForegroundColor Cyan
Write-Host "   Frontend: cd web && npm start" -ForegroundColor Cyan
Write-Host "   Mobile:   cd mobile && npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Set up your services:" -ForegroundColor Yellow
Write-Host "   - MongoDB: Make sure it's running" -ForegroundColor White
Write-Host "   - Email: Configure SMTP settings in backend/.env" -ForegroundColor White
Write-Host "   - SMS: Add Twilio credentials in backend/.env" -ForegroundColor White
Write-Host "   - Push: VAPID keys are already generated ✅" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green

Write-Host ""
Write-Host "Quick start commands:" -ForegroundColor Magenta
Write-Host "# Terminal 1 (Backend)" -ForegroundColor Gray
Write-Host "cd backend" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "# Terminal 2 (Frontend)" -ForegroundColor Gray
Write-Host "cd web" -ForegroundColor White
Write-Host "npm start" -ForegroundColor White
