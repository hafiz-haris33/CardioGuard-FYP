import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  
  // NAYA: Admin Hidden Auth States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setShowAdminModal(false);
      setAdminPassword('');
      navigation.navigate('AdminDashboard');
    } else {
      Alert.alert('Access Denied', 'Invalid Admin Credentials.');
      setAdminPassword('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />

      {/* Top Section: Logo & Text */}
      <View style={styles.topSection}>
        
        {/* Transparent Logo Container with Hidden Long Press */}
        <TouchableOpacity 
          style={styles.logoContainer}
          activeOpacity={0.8}
          delayLongPress={3000} // 3 Seconds required
          onLongPress={() => setShowAdminModal(true)}
        >
          <Image
            source={require('../assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.titleText}>
          Welcome to{'\n'}CardioGuard
        </Text>

        <Text style={styles.subtitleText}>
          Your intelligent companion for{'\n'}cardiovascular health monitoring.
        </Text>
      </View>

      {/* Bottom Section: Buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>
            I have a CardioGuard & Registered
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('VerifyDevice')}
        >
          <Text style={styles.secondaryButtonText}>
            I have a CardioGuard but not registered
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryButton}
          onPress={() => Linking.openURL('https://www.cardioguard.com')}
        >
          <Text style={styles.tertiaryButtonText}>
            I don't have a CardioGuard
          </Text>
        </TouchableOpacity>
      </View>

      {/* NAYA: Hidden Admin Modal */}
      <Modal visible={showAdminModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>System Override</Text>
            <Text style={styles.modalSub}>Enter Master Passcode</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Passcode..."
              placeholderTextColor="#4B5563"
              value={adminPassword}
              onChangeText={setAdminPassword}
              autoCapitalize="none"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdminModal(false); setAdminPassword(''); }}>
                <Text style={styles.cancelBtnText}>Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdminLogin}>
                <Text style={styles.confirmBtnText}>Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E14',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  topSection: { alignItems: 'center', marginTop: 20 },
  logoContainer: { justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  logoImage: { width: 150, height: 150 },
  titleText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginTop: 20, lineHeight: 40 },
  subtitleText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 24, paddingHorizontal: 10 },
  bottomSection: { width: '100%', paddingBottom: 10 },
  primaryButton: { backgroundColor: '#A5B4FC', width: '100%', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#1E3A8A', fontSize: 15, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#1F2937', width: '100%', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  tertiaryButton: { backgroundColor: 'transparent', width: '100%', paddingVertical: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  tertiaryButtonText: { color: '#9CA3AF', fontSize: 15, fontWeight: '600' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#15171C', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#262A36' },
  modalTitle: { color: '#EF4444', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  modalSub: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  modalInput: { backgroundColor: '#0B0E14', color: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#374151', marginBottom: 20, textAlign: 'center', letterSpacing: 5 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center', marginRight: 10, borderRadius: 10, backgroundColor: '#1F2937' },
  cancelBtnText: { color: '#D1D5DB', fontWeight: 'bold' },
  confirmBtn: { flex: 1, padding: 15, alignItems: 'center', marginLeft: 10, borderRadius: 10, backgroundColor: '#EF4444' },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold' }
});