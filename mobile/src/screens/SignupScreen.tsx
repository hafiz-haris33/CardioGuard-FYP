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
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import auth from '@react-native-firebase/auth';

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Pichli screen se aane wala deviceId yahan catch ho raha he
  // Agar kisi wajah se na aye to fallback me 'CG-XXXX-X' show hoga
  const linkedDeviceId = route.params?.deviceId || 'CG-XXXX-X';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing Details', 'Please enter your email and password to continue.');
      return;
    }

    setIsLoading(true);

    try {
      await auth().createUserWithEmailAndPassword(email.trim(), password);
      Alert.alert('Success', 'CardioGuard account created successfully!');
      // Saara data agay ProfileSetup screen ko pass kar rahe hen
      navigation.navigate('ProfileSetup', {
        deviceId: linkedDeviceId,
        fullName: fullName,
        email: email.trim(),
        emergencyContact: emergencyContact
      });

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'That email address is already in use!');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'That email address is invalid!');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password should be at least 6 characters.');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsLoading(false);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>Initialize Profile</Text>
            <Text style={styles.subtitleText}>
              Enter your biometric and contact details to secure your cardiac telemetry dashboard.
            </Text>

            {/* New UI: Linked Device Badge */}
            <View style={styles.deviceBadgeContainer}>
              <Feather name="cpu" size={14} color="#4ADE80" />
              <Text style={styles.deviceBadgeText}>LINKED: {linkedDeviceId}</Text>
            </View>
          </View>

          <View style={styles.formContainer}>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="John Doe"
                placeholderTextColor="#6B7280"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="john@gmail.com"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="............"
                placeholderTextColor="#6B7280"
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

            <Text style={styles.inputLabel}>EMERGENCY CONTACT NUMBER</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="03XX-XXXXXXX"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
              />
            </View>

            <Text style={styles.systemAlertText}>
              SYSTEM ALERT: Primary notification for automated cardiac event detection.
            </Text>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1E3A8A" size="small" />
              ) : (
                <>
                  <Text style={styles.createButtonText}>Create Account</Text>
                  <Feather name="user-plus" size={20} color="#1E3A8A" style={styles.btnIconRight} />
                </>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <View style={styles.loginRow}>
              <Text style={styles.footerText}>Already have an active sensor link? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.legalText}>
              PRIVACY_PROTOCOL    •    SERVICE_LEVEL_AGREEMENT
            </Text>
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#A5B4FC' },
  placeholderSpace: { width: 32 },
  headerDivider: { height: 1, backgroundColor: '#1F2937', width: '100%' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 40 },
  topSection: { alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 36, fontWeight: '800', color: '#F9FAFB', marginBottom: 12, textAlign: 'center' },
  subtitleText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 10, lineHeight: 24, marginBottom: 16 },

  // New Styles for Device Badge
  deviceBadgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74, 222, 128, 0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)' },
  deviceBadgeText: { color: '#4ADE80', fontSize: 12, fontWeight: '700', marginLeft: 8, letterSpacing: 1 },

  formContainer: { width: '100%' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#15171C', borderWidth: 1, borderColor: '#262A36', borderRadius: 12, marginBottom: 20, height: 56 },
  textInput: { flex: 1, color: '#F9FAFB', fontSize: 15, height: '100%', paddingHorizontal: 16 },
  eyeIcon: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  systemAlertText: { color: '#4ADE80', fontSize: 10, marginTop: -8, marginBottom: 24 },
  createButton: { backgroundColor: '#A5B4FC', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  createButtonText: { color: '#1E3A8A', fontSize: 18, fontWeight: '700' },
  btnIconRight: { marginLeft: 10 },
  footer: { marginTop: 40, alignItems: 'center' },
  loginRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  footerText: { color: '#9CA3AF', fontSize: 14 },
  loginText: { color: '#E0E7FF', fontSize: 14, fontWeight: '700' },
  legalText: { color: '#4B5563', fontSize: 10, letterSpacing: 0.5 },
});