import * as Yup from 'yup';

// User registration validation
export const registerSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .required('Phone number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  userType: Yup.string()
    .oneOf(['borrower', 'publisher'], 'Invalid user type')
    .required('User type is required'),
});

// Login validation
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

// OTP validation
export const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, 'OTP must be 6 digits')
    .matches(/^\d{6}$/, 'OTP must contain only numbers')
    .required('OTP is required'),
});

// Book creation validation
export const bookSchema = Yup.object().shape({
  title: Yup.string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
  author: Yup.string()
    .min(2, 'Author must be at least 2 characters')
    .max(100, 'Author must be less than 100 characters')
    .required('Author is required'),
  isbn: Yup.string()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Invalid ISBN format')
    .required('ISBN is required'),
  description: Yup.string()
    .max(1000, 'Description must be less than 1000 characters'),
  genre: Yup.string()
    .required('Genre is required'),
  condition: Yup.string()
    .oneOf(['excellent', 'good', 'fair', 'poor'], 'Invalid condition')
    .required('Condition is required'),
  rentPrice: Yup.number()
    .min(0, 'Rent price must be non-negative')
    .required('Rent price is required'),
  securityDeposit: Yup.number()
    .min(0, 'Security deposit must be non-negative')
    .required('Security deposit is required'),
});

// Profile update validation
export const profileSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),
  bio: Yup.string()
    .max(500, 'Bio must be less than 500 characters'),
  address: Yup.object().shape({
    street: Yup.string().max(100, 'Street must be less than 100 characters'),
    city: Yup.string().max(50, 'City must be less than 50 characters'),
    state: Yup.string().max(50, 'State must be less than 50 characters'),
    zipCode: Yup.string().matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
    country: Yup.string().max(50, 'Country must be less than 50 characters'),
  }),
});
