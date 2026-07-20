import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth'; // Firebase Auth Import kiya he

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  // --- Naya Firebase Login Function ---
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Details', 'Please enter your email and password to log in.');
      return;
    }

    setIsLoading(true);

    try {
      // Firebase ko login karne ka order dena
      await auth().signInWithEmailAndPassword(email.trim(), password);
      
      // Login successful hone par Dashboard bhejna
      Alert.alert('Welcome Back', 'Logged in successfully!');
      navigation.navigate('Dashboard'); 
      
    } catch (error: any) {
      // Agar password ya email ghalat ho
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'That email address is invalid!');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Naya Forgot Password Function ---
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your registered email address first to reset your password.');
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email.trim());
      Alert.alert('Link Sent!', 'A password reset link has been sent to your email. Please check your inbox or spam folder.');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Account Not Found', 'No account exists with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Welcome')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#D1D5DB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CardioGuard</Text>
        <View style={styles.placeholderSpace} />
      </View>
      <View style={styles.headerDivider} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.topSection}>
            <View style={styles.iconGlowRing}>
              <View style={styles.iconInnerCircle}>
                <MaterialCommunityIcons name="waveform" size={26} color="#E0E7FF" />
              </View>
            </View>

            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitleText}>
              Initialize biometric handshake to access your vitals.
            </Text>
          </View>

          <View style={styles.formCard}>
            
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputContainer}>
              <Feather name="at-sign" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="user@cardioguard.sys"
                placeholderTextColor="#4B5563"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="............"
                placeholderTextColor="#4B5563"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={isPasswordVisible ? "eye" : "eye-off"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Button Update */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1E3A8A" size="small" />
              ) : (
                <>
                  <Feather name="log-in" size={20} color="#1E3A8A" style={styles.btnIcon} />
                  <Text style={styles.loginButtonText}>Login</Text>
                </>
              )}
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#A5B4FC' },
  placeholderSpace: { width: 32 },
  headerDivider: { height: 1, backgroundColor: '#1F2937', width: '100%' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  topSection: { alignItems: 'center', marginBottom: 40 },
  iconGlowRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(129, 140, 248, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  iconInnerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#374151', justifyContent: 'center', alignItems: 'center', shadowColor: '#818CF8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  welcomeText: { fontSize: 28, fontWeight: '700', color: '#E0E7FF', marginBottom: 12 },
  subtitleText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  formCard: { backgroundColor: '#15171C', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#262A36' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#D1D5DB', letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B0E14', borderWidth: 1, borderColor: '#1F2937', borderRadius: 12, marginBottom: 24, height: 56 },
  inputIcon: { paddingHorizontal: 16 },
  textInput: { flex: 1, color: '#F9FAFB', fontSize: 15, height: '100%' },
  eyeIcon: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: '#9CA3AF', fontSize: 13 },
  loginButton: { backgroundColor: '#A5B4FC', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnIcon: { marginRight: 8 },
  loginButtonText: { color: '#1E3A8A', fontSize: 16, fontWeight: '700' },
});