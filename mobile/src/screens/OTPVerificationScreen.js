import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { email, phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('email'); // 'email' or 'sms'
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleBackspace = (index) => {
    if (otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email,
        phoneNumber,
        otp: otpString,
        type: verificationMethod
      });

      Alert.alert(
        'Verification Successful',
        'Your account has been verified successfully. It is now pending approval from an administrator.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ApprovalPending')
          }
        ]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Verification failed';
      Alert.alert('Error', errorMessage);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await axios.post('/api/auth/resend-otp', {
        email,
        phoneNumber,
        type: verificationMethod
      });

      Alert.alert('Success', `OTP has been resent to your ${verificationMethod}`);
      setTimer(300); // Reset timer
      setCanResend(false);
      setOtp(['', '', '', '', '', '']); // Clear current OTP
      inputRefs.current[0].focus();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
      Alert.alert('Error', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const switchVerificationMethod = () => {
    const newMethod = verificationMethod === 'email' ? 'sms' : 'email';
    setVerificationMethod(newMethod);
    setOtp(['', '', '', '', '', '']);
    setTimer(300);
    setCanResend(false);
    inputRefs.current[0].focus();
    
    // Automatically send OTP via new method
    handleResendOTP();
  };

  const maskContact = (contact, type) => {
    if (type === 'email') {
      const [username, domain] = contact.split('@');
      const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
      return `${maskedUsername}@${domain}`;
    } else {
      // Phone number
      return contact.replace(/(\d{3})\d*(\d{4})/, '$1****$2');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to your{' '}
          {verificationMethod === 'email' ? 'email' : 'phone number'}
        </Text>
        <Text style={styles.contactInfo}>
          {verificationMethod === 'email' 
            ? maskContact(email, 'email')
            : maskContact(phoneNumber, 'phone')
          }
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[
                styles.otpInput,
                digit !== '' && styles.otpInputFilled
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(index);
                }
              }}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {canResend ? 'You can resend OTP now' : `Resend OTP in ${formatTime(timer)}`}
          </Text>
        </View>

        <View style={styles.resendContainer}>
          <TouchableOpacity
            style={[styles.resendButton, (!canResend || resendLoading) && styles.resendButtonDisabled]}
            onPress={handleResendOTP}
            disabled={!canResend || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color="#2196F3" size="small" />
            ) : (
              <Text style={[
                styles.resendButtonText,
                (!canResend || resendLoading) && styles.resendButtonTextDisabled
              ]}>
                Resend OTP
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchMethodButton}
            onPress={switchVerificationMethod}
          >
            <Text style={styles.switchMethodText}>
              Send via {verificationMethod === 'email' ? 'SMS' : 'Email'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Registration</Text>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Didn't receive the code? Check your spam folder or try switching to{' '}
            {verificationMethod === 'email' ? 'SMS' : 'email'} verification.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
  },
  contactInfo: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
    color: '#2196F3',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#2196F3',
    backgroundColor: '#f3f9ff',
  },
  verifyButton: {
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  resendButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  resendButtonTextDisabled: {
    color: '#ccc',
  },
  switchMethodButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  switchMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff9800',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  helpContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default OTPVerificationScreen;
