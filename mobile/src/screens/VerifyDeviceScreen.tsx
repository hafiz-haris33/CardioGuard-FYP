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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import api from '../services/api'; // API service import kiya he

export default function VerifyDeviceScreen() {
  const navigation = useNavigation<any>();
  const [deviceId, setDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state add ki he

  // Backend se verify karne ka function
  const handleVerifyDevice = async () => {
    if (!deviceId.trim()) {
      Alert.alert('Error', 'Please enter a valid Device ID.');
      return;
    }

    setIsLoading(true);

    try {
      // Backend ki /verify-device API ko request bhejna
      const response = await api.post('/verify-device', {
        device_id: deviceId.trim(),
      });

      if (response.data.status === 'success') {
        // Agar device valid he to success message dikha kar Signup par bhej dena
        Alert.alert('Device Verified', response.data.message);
        navigation.navigate('Signup', { deviceId: deviceId.trim() });
      }
    } catch (error: any) {
      // Backend se aane wale errors ko handle karna
      if (error.response) {
        Alert.alert('Verification Failed', error.response.data.detail);
      } else {
        Alert.alert('Network Error', 'Cannot connect to the server. Check your IP/Network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Welcome')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#D1D5DB" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>CardioGuard</Text>
        
        {/* Placeholder added to keep the title exactly in the center */}
        <View style={styles.placeholderSpace} />
      </View>
      <View style={styles.headerDivider} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          
          {/* Main Titles */}
          <Text style={styles.mainTitle}>Verify Your{'\n'}Device</Text>
          <Text style={styles.subtitleText}>
            Enter the unique identifier located on your{'\n'}device's base plate to complete setup.
          </Text>

          {/* Input Card */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>UNIQUE DEVICE ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="CG-8829-X"
              placeholderTextColor="#818CF8"
              autoCapitalize="characters"
              value={deviceId}
              onChangeText={setDeviceId}
            />
          </View>

          {/* Helper Text */}
          <View style={styles.helperTextRow}>
            <Feather name="info" size={14} color="#9CA3AF" />
            <Text style={styles.helperText}> Format: CG-XXXX-X (Located on base plate)</Text>
          </View>

          {/* Verify Button with Glow Effect */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyDevice} // Ab ye button API call kare ga
            disabled={isLoading} // Loading ke doran button disable ho jaye ga
          >
            {isLoading ? (
              <ActivityIndicator color="#0B0E14" size="small" />
            ) : (
              <>
                <Text style={styles.verifyButtonText}>Verify Device</Text>
                <Feather name="arrow-right" size={20} color="#0B0E14" style={styles.btnIcon} />
              </>
            )}
          </TouchableOpacity>

          {/* Footer Text */}
          <TouchableOpacity style={styles.footerContainer}>
            <Text style={styles.footerText}>CAN'T FIND YOUR ID?</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F131A', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  placeholderSpace: {
    width: 32, 
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#1F2937',
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 48,
  },
  subtitleText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputCard: {
    backgroundColor: '#151A23', 
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#A5B4FC', 
    padding: 0,
  },
  helperTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginLeft: 6,
  },
  verifyButton: {
    backgroundColor: '#4F8EF7', 
    flexDirection: 'row',
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F8EF7',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 15, 
    elevation: 10,
  },
  verifyButtonText: {
    color: '#0B0E14', 
    fontSize: 16,
    fontWeight: '600',
  },
  btnIcon: {
    marginLeft: 12,
  },
  footerContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
  },
});