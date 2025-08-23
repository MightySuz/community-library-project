#!/bin/bash

# Community Library Setup Script
echo "🚀 Setting up Community Library Development Environment"
echo "======================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: brew services start mongodb/brew/mongodb-community"
    echo "   Or on Windows: net start MongoDB"
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
cd ../web
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "📦 Installing mobile dependencies..."
cd ../mobile
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install mobile dependencies"
    exit 1
fi

cd ..

echo "✅ All dependencies installed successfully!"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure your environment variables:"
echo "   - Copy backend/.env.example to backend/.env"
echo "   - Copy web/.env.example to web/.env"
echo "   - Update the values with your actual API keys"
echo ""
echo "2. Start the development servers:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd web && npm start"
echo "   Mobile:   cd mobile && npm start"
echo ""
echo "3. Set up your services:"
echo "   - MongoDB: Make sure it's running"
echo "   - Email: Configure SMTP settings in backend/.env"
echo "   - SMS: Add Twilio credentials in backend/.env"
echo "   - Push: VAPID keys are already generated"
echo ""
echo "🎉 Happy coding!"
