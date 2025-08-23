# Community Library - Development Guide

## 🚀 Quick Start for Developers

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** (local installation or MongoDB Atlas)
- **Expo CLI** for mobile development: `npm install -g expo-cli`
- **Git** for version control

### Environment Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd community-library
   npm install
   ```

2. **Install Dependencies for All Workspaces**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   
   # Install web dependencies
   cd web && npm install && cd ..
   
   # Install mobile dependencies
   cd mobile && npm install && cd ..
   
   # Install shared dependencies
   cd shared && npm install && cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your MongoDB URI, JWT secrets, etc.
   
   # Web environment
   cp web/.env.example web/.env
   # Edit web/.env with your API URLs
   ```

### Development Workflow

#### 🖥️ Backend Development
```bash
cd backend
npm run dev
```
- API will be available at `http://localhost:5000`
- Hot reload enabled with nodemon
- Check health at `http://localhost:5000/api/health`

#### 🌐 Web Development
```bash
cd web
npm start
```
- Web app will be available at `http://localhost:3000`
- Hot reload enabled
- Connects to backend API automatically

#### 📱 Mobile Development
```bash
cd mobile
npx expo start
```
- Expo DevTools will open in browser
- Use Expo Go app on your phone to test
- Or use iOS Simulator/Android Emulator

### 🏗️ Project Architecture

```
community-library/
├── backend/                # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   └── package.json
├── web/                   # React.js web app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── contexts/      # React contexts
│   └── package.json
├── mobile/                # React Native app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── screens/       # Screen components
│   │   ├── navigation/    # Navigation config
│   │   └── services/      # API services
│   └── package.json
├── shared/                # Shared utilities
│   ├── src/
│   │   ├── validation/    # Validation schemas
│   │   ├── utils/         # Common utilities
│   │   ├── constants/     # App constants
│   │   └── types/         # TypeScript types
│   └── package.json
└── package.json           # Root workspace config
```

### 🔧 Available Scripts

#### Root Level
- `npm run dev:web` - Start web development server
- `npm run dev:mobile` - Start mobile development with Expo
- `npm run dev:backend` - Start backend development server
- `npm run install:all` - Install all dependencies
- `npm run build:web` - Build web app for production
- `npm test` - Run tests across all workspaces

#### Backend (`cd backend`)
- `npm run dev` - Start with nodemon (hot reload)
- `npm start` - Start production server
- `npm test` - Run backend tests
- `npm run lint` - Run ESLint

#### Web (`cd web`)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint

#### Mobile (`cd mobile`)
- `npx expo start` - Start Expo development server
- `npx expo start --android` - Start for Android
- `npx expo start --ios` - Start for iOS
- `npm test` - Run tests

### 🗄️ Database Setup

#### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service: `mongod`
3. Update `backend/.env` with: `MONGODB_URI=mongodb://localhost:27017/community-library`

#### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `backend/.env` with your connection string

### 🔐 Authentication Setup

#### JWT Configuration
- Set strong `JWT_SECRET` in `backend/.env`
- Set `JWT_REFRESH_SECRET` for refresh tokens
- Configure token expiration times

#### OTP Services
- **Email**: Configure Gmail SMTP in `backend/.env`
- **SMS**: Set up Twilio account and add credentials

### 💳 Payment Integration

#### Stripe Setup
1. Create [Stripe](https://stripe.com) account
2. Get API keys from dashboard
3. Add to `backend/.env` and `web/.env`
4. Configure webhooks for payment events

### 📱 Mobile Development Tips

#### Expo Configuration
- Install Expo CLI globally: `npm install -g expo-cli`
- Use Expo Go app for testing on real devices
- Configure app.json for app metadata

#### Platform-specific Features
- **Camera/Barcode**: Already configured in app.json
- **Notifications**: Set up Firebase for push notifications
- **Icons**: Use react-native-vector-icons

### 🌐 Web Development Tips

#### Material-UI Theme
- Custom theme in `web/src/theme.js`
- Primary color: Green (#2E7D32)
- Secondary color: Orange (#FF6F00)

#### Responsive Design
- Mobile-first approach
- Use Material-UI breakpoints
- Test on various screen sizes

### 🧪 Testing Strategy

#### Backend Testing
- Unit tests for services and utilities
- Integration tests for API endpoints
- Use Jest and Supertest

#### Frontend Testing
- Component testing with React Testing Library
- E2E testing with Cypress (optional)
- Jest for unit tests

#### Mobile Testing
- React Native Testing Library
- Detox for E2E testing (optional)
- Test on both iOS and Android

### 📦 Deployment

#### Backend Deployment
- **Heroku**: Easy deployment with git
- **Railway**: Modern alternative to Heroku
- **DigitalOcean**: More control over infrastructure

#### Web Deployment
- **Vercel**: Best for React apps
- **Netlify**: Great for static sites
- **AWS S3 + CloudFront**: Enterprise solution

#### Mobile Deployment
- **Expo Build Service**: `expo build:android` / `expo build:ios`
- **Google Play Store**: Android app distribution
- **Apple App Store**: iOS app distribution

### 🐛 Common Issues

#### Port Conflicts
- Backend: Change `PORT` in `backend/.env`
- Web: Set `PORT=3001` in `web/.env.local`

#### CORS Issues
- Check `CORS_ORIGIN` in `backend/.env`
- Ensure web app URL is allowed

#### Mobile Build Issues
- Clear Expo cache: `expo r -c`
- Delete node_modules and reinstall
- Check Expo SDK compatibility

### 📚 Learning Resources

#### Documentation
- [React.js](https://reactjs.org/docs)
- [React Native](https://reactnative.dev/docs)
- [Expo](https://docs.expo.dev/)
- [Node.js](https://nodejs.org/en/docs/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)

#### Tutorials
- [React Native Tutorial](https://reactnative.dev/docs/tutorial)
- [Node.js Guide](https://nodejs.org/en/docs/guides/)
- [MongoDB University](https://university.mongodb.com/)

### 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run linting: `npm run lint`
5. Commit changes: `git commit -m "Add feature"`
6. Push to branch: `git push origin feature-name`
7. Submit pull request

### 📞 Support

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README.md and this guide

---

**Happy Coding! 🚀**
