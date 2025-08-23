# 🌐 Community Library Research Platform - Complete Guide

**Live Demo URL:** `https://sujaljaiswal.github.io/community-library-project/`

## 🎯 Research Participant Guide

### 👤 **User Types & Access**

#### **Regular Users (Residents)**
- **Community Access:** `john_doe`, `sarovar_user`, `cyberzon_user`
- **Password:** Any password (demo mode)
- **Features:** Community-specific book management, rental tracking

#### **Super Admin**
- **Username:** `admin@aparna.com`
- **Password:** `admin123`
- **Features:** All communities + management tools

### 🏘️ **Community Structure** (Updated)
- **Aparna Sarovar Zenith** (Primary community)
- **Aparna Sarovar** (Secondary community) 
- **Aparna Cyberzon** (Tertiary community)

### 🔐 **OTP Verification**
For secure operations (book deletion, admin actions), use OTP: **1234**

---

## 📱 **Features to Test**

### 1. **Enhanced Authentication & Access Control**
- [x] Username/email-based login
- [x] Community auto-assignment based on email/username
- [x] Role-based access (Resident vs Super Admin)
- [x] OTP verification for sensitive operations

### 2. **Advanced Book Management**
- [x] **Bulk Book Registration:** Add multiple books at once
- [x] **Google Books API:** Automatic book covers and metadata
- [x] **ISBN Barcode Scanning:** Camera-based book addition
- [x] **Block/Apartment Fields:** Enhanced user profiles
- [x] Browse books with visual covers
- [x] Search and filter functionality
- [x] Community-specific book collections

### 3. **Community Isolation & Data Security**
- [x] Complete data separation between communities
- [x] Users only see their community's books
- [x] Cross-community access restrictions
- [x] Secure community assignment

### 4. **Super Admin Dashboard**
- [x] **User Management:** Verify/suspend users across communities
- [x] **All Books Management:** Complete inventory oversight
- [x] **Community Analytics:** Statistics and performance metrics
- [x] Real-time data updates and controls

### 5. **Financial & Transaction Features**
- [x] INR currency throughout the platform
- [x] Daily rental pricing format (₹50/day)
- [x] Earnings tracking per book owner
- [x] Community-wise financial analytics

### 6. **Mobile & User Experience**
- [x] Responsive design for all devices
- [x] Camera integration for barcode scanning
- [x] Intuitive navigation and user interface
- [x] Visual book covers enhance browsing

---

## 🧪 **Research Scenarios**

### Scenario 1: New User Registration
1. Click "Register here"
2. Fill form with community selection
3. Login and explore dashboard

### Scenario 2: Book Lending
1. Login as `john_doe`
2. Go to "Books" section
3. Add a new book
4. Check "My Books" in dashboard

### Scenario 3: Book Borrowing
1. Browse available books
2. Click "Request Book"
3. Check if request goes through

### Scenario 4: Security Testing
1. Try to delete a book (requires OTP)
2. Access wallet management (requires OTP)
3. Test with wrong OTP

### Scenario 5: Community Restrictions
1. Login as different users
2. Notice different book collections
3. Test community isolation

---

## 📊 Data Collection Points

### User Behavior:
- Registration completion rate
- Login success/failure rate
- Book browsing patterns
- Book addition frequency
- Community switching attempts

### Usability Metrics:
- Time to complete first book addition
- Navigation pattern analysis
- Error rate in OTP verification
- Mobile vs desktop usage

### Feature Adoption:
- Most used features
- Abandoned user flows
- Popular book categories
- Wallet feature usage

---

## 🔧 Technical Details

### Frontend: React.js
- Single Page Application (SPA)
- Responsive design
- Component-based architecture

### Features Implemented:
- State management with React hooks
- Community-based data filtering
- OTP simulation
- Mobile-first design
- INR currency integration

### Browser Support:
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS/Android)
- Tablet compatibility

---

## 📝 Feedback Collection

### Questions for Participants:

1. **Ease of Use:** How intuitive was the registration process?
2. **Community Feature:** Did the community isolation make sense?
3. **Security:** How did you feel about OTP verification?
4. **Book Management:** Was adding/managing books straightforward?
5. **Mobile Experience:** How was the mobile interface?
6. **Overall:** What features would you add/remove?

### Feedback Form:
*(Include link to feedback form after deployment)*

---

## 🚀 Deployment Status

**Current Status:** ✅ Ready for deployment
**Expected URL:** `https://community-library-research.netlify.app`
**Deployment Time:** ~5 minutes
**SSL Certificate:** Included
**CDN:** Global distribution

### Post-Deployment Checklist:
- [ ] Test all login credentials
- [ ] Verify OTP functionality
- [ ] Check mobile responsiveness
- [ ] Test community isolation
- [ ] Validate book management
- [ ] Confirm analytics tracking

---

## 📞 Support

**For Technical Issues:**
- Check browser console for errors
- Try different browsers
- Clear browser cache
- Test on mobile device

**For Research Questions:**
- Contact research team
- Submit feedback through form
- Schedule follow-up interview

---

*Last Updated: August 23, 2025*
*Version: 1.0 - Research Prototype*
