import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ApprovalPendingScreen from '../screens/auth/ApprovalPendingScreen';
import BooksScreen from '../screens/books/BooksScreen';
import BookDetailsScreen from '../screens/books/BookDetailsScreen';
import AddBookScreen from '../screens/books/AddBookScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import PublisherDashboardScreen from '../screens/publisher/PublisherDashboardScreen';
import BorrowerDashboardScreen from '../screens/borrower/BorrowerDashboardScreen';
import RentalManagementScreen from '../screens/rental/RentalManagementScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ title: 'Welcome Back' }}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ title: 'Join Community' }}
    />
    <Stack.Screen 
      name="OTPVerification" 
      component={OTPVerificationScreen}
      options={{ title: 'Verify Account' }}
    />
    <Stack.Screen 
      name="ApprovalPending" 
      component={ApprovalPendingScreen}
      options={{ title: 'Approval Pending' }}
    />
  </Stack.Navigator>
);

// Books Stack
const BooksStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="BooksList" 
      component={BooksScreen}
      options={{ title: 'Library Catalog' }}
    />
    <Stack.Screen 
      name="BookDetails" 
      component={BookDetailsScreen}
      options={{ title: 'Book Details' }}
    />
    <Stack.Screen 
      name="AddBook" 
      component={AddBookScreen}
      options={{ title: 'Add New Book' }}
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'My Profile' }}
    />
    <Stack.Screen 
      name="Wallet" 
      component={WalletScreen}
      options={{ title: 'My Wallet' }}
    />
  </Stack.Navigator>
);

// Admin Stack
const AdminStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="AdminDashboard" 
      component={AdminDashboardScreen}
      options={{ headerShown: false }} // AdminDashboardScreen has its own header
    />
  </Stack.Navigator>
);

// Publisher Stack
const PublisherStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="PublisherDashboard" 
      component={PublisherDashboardScreen}
      options={{ headerShown: false }} // PublisherDashboardScreen has its own header
    />
  </Stack.Navigator>
);

// Borrower Stack
const BorrowerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="BorrowerDashboard" 
      component={BorrowerDashboardScreen}
      options={{ headerShown: false }} // BorrowerDashboardScreen has its own header
    />
    <Stack.Screen 
      name="RentalManagement" 
      component={RentalManagementScreen}
      options={{ headerShown: false }} // RentalManagementScreen has its own header
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = ({ userRole }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Books') {
          iconName = 'book';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        } else if (route.name === 'Admin') {
          iconName = 'admin-panel-settings';
        } else if (route.name === 'Publisher') {
          iconName = 'store';
        } else if (route.name === 'Borrower') {
          iconName = 'library-books';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ title: 'Home' }}
    />
    <Tab.Screen 
      name="Books" 
      component={BooksStack}
      options={{ title: 'Books' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStack}
      options={{ title: 'Profile' }}
    />
    {userRole === 'admin' && (
      <Tab.Screen 
        name="Admin" 
        component={AdminStack}
        options={{ title: 'Admin' }}
      />
    )}
    {userRole === 'publisher' && (
      <Tab.Screen 
        name="Publisher" 
        component={PublisherStack}
        options={{ title: 'Publisher' }}
      />
    )}
    {userRole === 'borrower' && (
      <Tab.Screen 
        name="Borrower" 
        component={BorrowerStack}
        options={{ title: 'Library' }}
      />
    )}
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = ({ isAuthenticated, userRole, isApproved }) => {
  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !isApproved ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="ApprovalPending" 
            component={ApprovalPendingScreen}
          />
        </Stack.Navigator>
      ) : (
        <MainTabs userRole={userRole} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
