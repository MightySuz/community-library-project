import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ApprovalPendingScreen = ({ navigation }) => {
  const scaleValue = new Animated.Value(0);
  const rotateValue = new Animated.Value(0);

  React.useEffect(() => {
    // Scale animation for the clock icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation for the loading indicator
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleContactSupport = () => {
    // Navigate to support or show contact options
    navigation.navigate('Contact');
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Animated Clock Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ scale: scaleValue }] }
          ]}
        >
          <MaterialIcons name="access-time" size={80} color="#ff9800" />
        </Animated.View>

        {/* Loading Spinner */}
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
          <MaterialIcons name="hourglass-empty" size={24} color="#2196F3" />
        </Animated.View>

        <Text style={styles.title}>Account Pending Approval</Text>
        
        <Text style={styles.subtitle}>
          Your registration has been successfully submitted!
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialIcons name="check-circle" size={24} color="#4caf50" />
            <Text style={styles.statusTitle}>Registration Complete</Text>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, styles.stepCompleted]}>
                <MaterialIcons name="check" size={16} color="#fff" />
              </View>
              <Text style={styles.stepText}>Account Created</Text>
            </View>
            
            <View style={styles.stepLine} />
            
            <View style={styles.step}>
              <View style={[styles.stepIcon, styles.stepCompleted]}>
                <MaterialIcons name="check" size={16} color="#fff" />
              </View>
              <Text style={styles.stepText}>Email/Phone Verified</Text>
            </View>
            
            <View style={styles.stepLine} />
            
            <View style={styles.step}>
              <View style={[styles.stepIcon, styles.stepPending]}>
                <MaterialIcons name="hourglass-empty" size={16} color="#ff9800" />
              </View>
              <Text style={styles.stepText}>Administrator Review</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialIcons name="person" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                An administrator will review your application
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="email" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                You'll receive an email notification once approved
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                This process typically takes 1-2 business days
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Expected Timeline</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <Text style={styles.timelineText}>
              <Text style={styles.timelineBold}>Within 24 hours:</Text> Initial review
            </Text>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <Text style={styles.timelineText}>
              <Text style={styles.timelineBold}>1-2 business days:</Text> Final approval
            </Text>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <Text style={styles.timelineText}>
              <Text style={styles.timelineBold}>Upon approval:</Text> Full access granted
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToLogin}
          >
            <Text style={styles.primaryButtonText}>Back to Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.secondaryButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions about your application? Our support team is here to help.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#4caf50',
  },
  stepContainer: {
    alignItems: 'center',
  },
  step: {
    alignItems: 'center',
    marginVertical: 8,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCompleted: {
    backgroundColor: '#4caf50',
  },
  stepPending: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginVertical: 4,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  timelineCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginTop: 6,
    marginRight: 12,
  },
  timelineText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  timelineBold: {
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ApprovalPendingScreen;
