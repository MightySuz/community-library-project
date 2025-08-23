import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const validationSchema = Yup.object({
  emailOtp: Yup.string()
    .length(6, 'OTP must be 6 digits')
    .matches(/^\d{6}$/, 'OTP must contain only numbers')
    .required('Email OTP is required'),
  phoneOtp: Yup.string()
    .length(6, 'OTP must be 6 digits')
    .matches(/^\d{6}$/, 'OTP must contain only numbers')
    .required('Phone OTP is required')
});

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const { userId, email, phoneNumber } = location.state || {};

  useEffect(() => {
    if (!userId) {
      navigate('/register');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, navigate]);

  const formik = useFormik({
    initialValues: {
      emailOtp: '',
      phoneOtp: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-otp`, {
          userId,
          emailOtp: values.emailOtp,
          phoneOtp: values.phoneOtp
        });
        
        setSuccess('Verification successful! Your account is pending admin approval.');
        
        setTimeout(() => {
          navigate('/approval-pending');
        }, 2000);
        
      } catch (err) {
        setError(err.response?.data?.error || 'Verification failed. Please check your OTP codes.');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/resend-otp`, { userId });
      setSuccess('New OTP codes sent to your email and phone.');
      setTimeLeft(600); // Reset timer
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    const maskedName = name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
    return `${maskedName}@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  };

  if (!userId) {
    return null;
  }

  return (
    <Container component="main" maxWidth="sm">
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
            Verify Your Account
          </Typography>
          
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            We've sent verification codes to your email and phone number. 
            Please enter both codes below to complete your registration.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Email: {maskEmail(email)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: {maskPhone(phoneNumber)}
            </Typography>
          </Box>

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
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="emailOtp"
                  name="emailOtp"
                  label="Email Verification Code"
                  placeholder="000000"
                  value={formik.values.emailOtp}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.emailOtp && Boolean(formik.errors.emailOtp)}
                  helperText={formik.touched.emailOtp && formik.errors.emailOtp}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phoneOtp"
                  name="phoneOtp"
                  label="SMS Verification Code"
                  placeholder="000000"
                  value={formik.values.phoneOtp}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phoneOtp && Boolean(formik.errors.phoneOtp)}
                  helperText={formik.touched.phoneOtp && formik.errors.phoneOtp}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || timeLeft === 0}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Time remaining: {formatTime(timeLeft)}
            </Typography>
            
            <Button
              variant="text"
              onClick={handleResendOTP}
              disabled={resendLoading || timeLeft > 0}
              startIcon={resendLoading && <CircularProgress size={16} />}
            >
              {resendLoading ? 'Sending...' : 'Resend OTP Codes'}
            </Button>
          </Box>

          <Box mt={3} textAlign="center">
            <Typography variant="body2">
              Need help?{' '}
              <Link to="/support" style={{ textDecoration: 'none' }}>
                Contact Support
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default OTPVerificationPage;
