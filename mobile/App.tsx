import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BLEProvider } from './src/context/BLEContext';

// Import all screens
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BluetoothScreen from './src/screens/BluetoothScreen';
import VerifyDeviceScreen from './src/screens/VerifyDeviceScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AIPredictionScreen from './src/screens/AIPredictionScreen';
import FitnessScreen from './src/screens/FitnessScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
// NAYA: Admin Dashboard Import
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <BLEProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Bluetooth" component={BluetoothScreen} />
          <Stack.Screen name="VerifyDevice" component={VerifyDeviceScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AIPrediction" component={AIPredictionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Fitness" component={FitnessScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          {/* NAYA: Admin Route */}
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </BLEProvider>
  );
}