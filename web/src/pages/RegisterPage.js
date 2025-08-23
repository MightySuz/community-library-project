import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const steps = ['Personal Information', 'Contact Details', 'Account Setup'];

const validationSchema = Yup.object({
  fullName: Yup.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .required('Full name is required'),
  parentName: Yup.string()
    .min(2, 'Parent name must be at least 2 characters')
    .max(100, 'Parent name must be less than 100 characters')
    .required('Parent name is required'),
  communityName: Yup.string()
    .min(2, 'Community name must be at least 2 characters')
    .max(100, 'Community name must be less than 100 characters')
    .required('Community name is required'),
  phoneNumber: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .required('Phone number is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  persona: Yup.array()
    .min(1, 'Please select at least one role')
    .required('Role selection is required')
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formik = useFormik({
    initialValues: {
      fullName: '',
      parentName: '',
      communityName: '',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
      persona: []
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, values);
        
        setSuccess('Registration successful! Please check your email and phone for verification codes.');
        
        // Navigate to OTP verification page with user ID
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { 
              userId: response.data.data.userId,
              email: response.data.data.email,
              phoneNumber: response.data.data.phoneNumber
            } 
          });
        }, 2000);
        
      } catch (err) {
        setError(err.response?.data?.error || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleNext = () => {
    const currentStepFields = getStepFields(activeStep);
    const hasErrors = currentStepFields.some(field => 
      formik.touched[field] && formik.errors[field]
    );
    
    if (!hasErrors) {
      setActiveStep((prevStep) => prevStep + 1);
    } else {
      // Touch all fields in current step to show validation errors
      currentStepFields.forEach(field => {
        formik.setFieldTouched(field, true);
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return ['fullName', 'parentName', 'communityName'];
      case 1:
        return ['phoneNumber', 'email'];
      case 2:
        return ['password', 'confirmPassword', 'persona'];
      default:
        return [];
    }
  };

  const handlePersonaChange = (persona) => {
    const currentPersonas = formik.values.persona;
    if (currentPersonas.includes(persona)) {
      formik.setFieldValue('persona', currentPersonas.filter(p => p !== persona));
    } else {
      formik.setFieldValue('persona', [...currentPersonas, persona]);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <TextField
              fullWidth
              id="fullName"
              name="fullName"
              label="Full Name"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fullName && Boolean(formik.errors.fullName)}
              helperText={formik.touched.fullName && formik.errors.fullName}
              margin="normal"
            />
            <TextField
              fullWidth
              id="parentName"
              name="parentName"
              label="Parent's Name"
              value={formik.values.parentName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.parentName && Boolean(formik.errors.parentName)}
              helperText={formik.touched.parentName && formik.errors.parentName}
              margin="normal"
            />
            <TextField
              fullWidth
              id="communityName"
              name="communityName"
              label="Community Name"
              value={formik.values.communityName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.communityName && Boolean(formik.errors.communityName)}
              helperText={formik.touched.communityName && formik.errors.communityName}
              margin="normal"
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Contact Details
            </Typography>
            <TextField
              fullWidth
              id="phoneNumber"
              name="phoneNumber"
              label="Phone Number"
              placeholder="+1234567890"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
              helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
              margin="normal"
            />
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Account Setup
            </Typography>
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
            />
            <TextField
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              margin="normal"
            />
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                Select Your Role(s):
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.persona.includes('publisher')}
                      onChange={() => handlePersonaChange('publisher')}
                      name="publisher"
                    />
                  }
                  label="Publisher (I want to lend books to others)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.persona.includes('borrower')}
                      onChange={() => handlePersonaChange('borrower')}
                      name="borrower"
                    />
                  }
                  label="Borrower (I want to borrow books from others)"
                />
              </FormGroup>
              {formik.touched.persona && formik.errors.persona && (
                <Typography color="error" variant="caption">
                  {formik.errors.persona}
                </Typography>
              )}
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Join Community Library
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              ) : (
                <Button onClick={handleNext} variant="contained">
                  Next
                </Button>
              )}
            </Box>
          </form>

          <Box mt={3} textAlign="center">
            <Typography variant="body2">
              Already have an account?{' '}
              <Link to="/login" style={{ textDecoration: 'none' }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
