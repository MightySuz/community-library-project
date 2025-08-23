import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full name is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  phoneNumber: Yup.string()
    .matches(/^\+?[\d\s-()]+$/, 'Invalid phone number')
    .required('Phone number is required'),
  parentName: Yup.string()
    .min(2, 'Parent name must be at least 2 characters')
    .required('Parent name is required'),
  communityName: Yup.string()
    .min(2, 'Community name must be at least 2 characters')
    .required('Community name is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/(?=.*[a-z])/, 'Password must contain lowercase letter')
    .matches(/(?=.*[A-Z])/, 'Password must contain uppercase letter')
    .matches(/(?=.*\d)/, 'Password must contain number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  persona: Yup.array()
    .min(1, 'Select at least one role')
    .required('Role selection is required')
});

const RegisterScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    parentName: '',
    communityName: '',
    password: '',
    confirmPassword: '',
    persona: []
  });
  const [errors, setErrors] = useState({});

  const personas = [
    { value: 'publisher', label: 'Publisher (Lend Books)' },
    { value: 'borrower', label: 'Borrower (Borrow Books)' },
    { value: 'administrator', label: 'Administrator (Manage System)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePersonaToggle = (persona) => {
    const updatedPersonas = formData.persona.includes(persona)
      ? formData.persona.filter(p => p !== persona)
      : [...formData.persona, persona];
    
    handleInputChange('persona', updatedPersonas);
  };

  const validateStep = async (step) => {
    try {
      let fieldsToValidate = {};
      
      switch (step) {
        case 1:
          fieldsToValidate = {
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber
          };
          break;
        case 2:
          fieldsToValidate = {
            parentName: formData.parentName,
            communityName: formData.communityName
          };
          break;
        case 3:
          fieldsToValidate = {
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            persona: formData.persona
          };
          break;
      }

      await validationSchema.validate(fieldsToValidate, { abortEarly: false });
      setErrors({});
      return true;
    } catch (validationErrors) {
      const errorObj = {};
      validationErrors.inner.forEach(error => {
        errorObj[error.path] = error.message;
      });
      setErrors(errorObj);
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    const isValid = await validateStep(3);
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', formData);
      
      Alert.alert(
        'Registration Successful',
        'Please check your email/SMS for the verification code.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OTPVerification', {
              email: formData.email,
              phoneNumber: formData.phoneNumber
            })
          }
        ]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.fullName && styles.inputError]}
          value={formData.fullName}
          onChangeText={(value) => handleInputChange('fullName', value)}
          placeholder="Enter your full name"
          autoCapitalize="words"
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', value)}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Family & Community</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Parent/Guardian Name *</Text>
        <TextInput
          style={[styles.input, errors.parentName && styles.inputError]}
          value={formData.parentName}
          onChangeText={(value) => handleInputChange('parentName', value)}
          placeholder="Enter parent/guardian name"
          autoCapitalize="words"
        />
        {errors.parentName && <Text style={styles.errorText}>{errors.parentName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Community Name *</Text>
        <TextInput
          style={[styles.input, errors.communityName && styles.inputError]}
          value={formData.communityName}
          onChangeText={(value) => handleInputChange('communityName', value)}
          placeholder="Enter your community name"
          autoCapitalize="words"
        />
        {errors.communityName && <Text style={styles.errorText}>{errors.communityName}</Text>}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Security & Role</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          placeholder="Enter your password"
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
          placeholder="Confirm your password"
          secureTextEntry
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Select Your Role(s) *</Text>
        {personas.map((persona) => (
          <TouchableOpacity
            key={persona.value}
            style={[
              styles.checkboxContainer,
              formData.persona.includes(persona.value) && styles.checkboxSelected
            ]}
            onPress={() => handlePersonaToggle(persona.value)}
          >
            <View style={[
              styles.checkbox,
              formData.persona.includes(persona.value) && styles.checkboxChecked
            ]}>
              {formData.persona.includes(persona.value) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>{persona.label}</Text>
          </TouchableOpacity>
        ))}
        {errors.persona && <Text style={styles.errorText}>{errors.persona}</Text>}
      </View>
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepIndicatorContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepNumber,
              currentStep >= step && styles.stepNumberActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderButtons = () => (
    <View style={styles.buttonContainer}>
      {currentStep > 1 && (
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[styles.button, styles.nextButton]}
        onPress={currentStep === 3 ? handleSubmit : handleNext}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextButtonText}>
            {currentStep === 3 ? 'Register' : 'Next'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join our Community Library</Text>
        
        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        {renderButtons()}
        
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2196F3',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
  },
  stepLineActive: {
    backgroundColor: '#2196F3',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkboxSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#f3f9ff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#2196F3',
    marginLeft: 10,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#2196F3',
  },
});

export default RegisterScreen;
