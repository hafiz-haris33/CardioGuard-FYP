import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';

// Firebase & API Import
import auth from '@react-native-firebase/auth';
import api from '../services/api';

// Icons Import
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bloodType, setBloodType] = useState('Not Set');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Emergency Protocol States
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Dropdown State for Blood Group
  const [isBloodModalVisible, setIsBloodModalVisible] = useState(false);
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // 1. Fetch User Data on Screen Load
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth().currentUser;
      if (currentUser?.uid) {
        try {
          const response = await api.get(`/user/${currentUser.uid}`);
          if (response.data) {
            setFullName(response.data.full_name || '');
            setAge(response.data.age ? response.data.age.toString() : '');
            setGender(response.data.gender || 'Male');
            setWeight(response.data.weight ? response.data.weight.toString() : '');
            setHeight(response.data.height ? response.data.height.toString() : '');
            setBloodType(response.data.blood_type || 'Not Set');
            setProfilePic(response.data.profile_pic || null);
            
            // Agar emergency contact backend par object/string ki shakal me ho to yahan split kar sakte hen
            setContactName(response.data.emergency_contact || '');
          }
        } catch (error) {
          console.log("Error fetching profile for edit:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUserData();
  }, []);

  // 2. Select Image from Gallery
  const handleImagePick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true, // Backend par bhejne ke liye asani hogi
      quality: 0.5,
    });

    if (result.assets && result.assets.length > 0) {
      const imageAsset = result.assets[0];
      // Base64 URI create kar rahe hen
      const base64Image = `data:${imageAsset.type};base64,${imageAsset.base64}`;
      setProfilePic(base64Image);
    }
  };

  // 3. Save Data to Database
  const handleSave = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser?.uid) return;

    setIsSaving(true);
    try {
      const updatePayload = {
        full_name: fullName,
        age: parseInt(age) || null,
        gender: gender,
        weight: parseFloat(weight) || null,
        height: parseInt(height) || null,
        blood_type: bloodType === 'Not Set' ? null : bloodType,
        profile_pic: profilePic,
        emergency_contact: contactName,
      };

      // Backend par update ki request
      await api.put(`/user/update/${currentUser.uid}`, updatePayload);
      
      // Update success hone ke baad wapis pichli screen (Profile) par bhejen
      navigation.goBack();
    } catch (error) {
      console.log("Error updating profile:", error);
      Alert.alert("Update Failed", "Failed to update profile. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Render Logic (Image ya First Letter)
  const renderAvatar = () => {
    if (profilePic) {
      return <Image source={{ uri: profilePic }} style={styles.profileImage} />;
    } else {
      const firstLetter = fullName ? fullName.charAt(0).toUpperCase() : 'U';
      return (
        <View style={styles.placeholderAvatar}>
          <Text style={styles.placeholderText}>{firstLetter}</Text>
        </View>
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      {/* Top Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={isSaving}>
          <Feather name="arrow-left" size={24} color="#D1D5DB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#4ADE80" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. Biometric Identity (Profile Picture) */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarGlowRing}>
              {renderAvatar()}
              <TouchableOpacity style={styles.cameraIconBadge} onPress={handleImagePick}>
                <Feather name="camera" size={16} color="#0B0E14" />
              </TouchableOpacity>
            </View>
            <Text style={styles.biometricLabel}>BIOMETRIC IDENTITY</Text>
          </View>

          {/* 2. Personal Info Cards */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputRow}>
              <Feather name="user" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your name"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Naya Blood Group Field (Dropdown Modal ke sath) */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Blood Group</Text>
            <TouchableOpacity 
              style={styles.inputRow} 
              onPress={() => setIsBloodModalVisible(true)}
            >
              <MaterialCommunityIcons name="water-outline" size={22} color="#EF4444" />
              <Text style={[styles.textInput, { color: bloodType === 'Not Set' ? '#6B7280' : '#FFFFFF' }]}>
                {bloodType}
              </Text>
              <Feather name="chevron-down" size={20} color="#9CA3AF" style={{ position: 'absolute', right: 0 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.inputRow}>
              <Feather name="calendar" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.textInputLarge}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="00"
                placeholderTextColor="#374151"
              />
              <Text style={styles.inputUnit}>yrs</Text>
            </View>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Biological Sex</Text>
            <View style={styles.genderToggleRow}>
              <TouchableOpacity 
                style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]}
                onPress={() => setGender('Male')}
              >
                <Text style={[styles.genderBtnText, gender === 'Male' && styles.genderBtnTextActive]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]}
                onPress={() => setGender('Female')}
              >
                <Text style={[styles.genderBtnText, gender === 'Female' && styles.genderBtnTextActive]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Weight</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="dumbbell" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.textInputLarge}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="00"
                placeholderTextColor="#374151"
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Height</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="ruler" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.textInputLarge}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="000"
                placeholderTextColor="#374151"
              />
              <Text style={styles.inputUnit}>cm</Text>
            </View>
          </View>

          {/* 3. Emergency Protocol Section */}
          <View style={styles.emergencySectionHeader}>
            <MaterialCommunityIcons name="medical-bag" size={24} color="#FCA5A5" />
            <Text style={styles.emergencyTitle}>Emergency Protocol</Text>
          </View>

          <View style={styles.emergencyCard}>
            <Text style={styles.inputLabel}>Primary Contact Number</Text>
            <TextInput
              style={[styles.textInput, styles.emergencyInputBorder]}
              value={contactName}
              onChangeText={setContactName}
              placeholder="e.g. John Doe"
              placeholderTextColor="#6B7280"
            />
            
            
          </View>

          {/* Wipe Data Button */}
          <TouchableOpacity style={styles.wipeDataButton}>
            <Feather name="trash-2" size={16} color="#4B5563" style={styles.wipeDataIcon} />
            <Text style={styles.wipeDataText}>Wipe All Health Data</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Blood Group Selection Modal */}
      <Modal
        visible={isBloodModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsBloodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Blood Group</Text>
            <ScrollView style={{ width: '100%' }}>
              {bloodGroups.map((bg, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.modalItem}
                  onPress={() => {
                    setBloodType(bg);
                    setIsBloodModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{bg}</Text>
                  {bloodType === bg && <Feather name="check" size={20} color="#4ADE80" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsBloodModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0E14' },
  
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 15 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#E0E7FF', fontSize: 20, fontWeight: '600' },
  saveButton: { backgroundColor: '#1E2430', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#4ADE80', minWidth: 70, alignItems: 'center' },
  saveButtonText: { color: '#4ADE80', fontSize: 14, fontWeight: '700' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 30 },
  
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarGlowRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#06B6D4', justifyContent: 'center', alignItems: 'center', position: 'relative', shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10, backgroundColor: '#1E293B' },
  profileImage: { width: 104, height: 104, borderRadius: 52 },
  placeholderAvatar: { width: 104, height: 104, borderRadius: 52, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#A5B4FC', fontSize: 40, fontWeight: '700' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: -4, backgroundColor: '#A5B4FC', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0B0E14' },
  biometricLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginTop: 16 },

  inputCard: { backgroundColor: '#151A23', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937', justifyContent: 'center' },
  inputLabel: { color: '#818CF8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  textInput: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginLeft: 12, paddingVertical: 0 },
  textInputLarge: { flex: 1, color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginLeft: 12, paddingVertical: 0 },
  inputUnit: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },

  genderToggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  genderBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#1F2937', marginHorizontal: 4 },
  genderBtnActive: { backgroundColor: '#1E293B', borderColor: '#3B82F6' },
  genderBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  genderBtnTextActive: { color: '#A5B4FC' },

  emergencySectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  emergencyTitle: { color: '#FCA5A5', fontSize: 20, fontWeight: '700', marginLeft: 10 },
  
  emergencyCard: { backgroundColor: '#151A23', borderRadius: 16, padding: 16, marginBottom: 30, borderWidth: 1, borderColor: '#3F2C2C' },
  emergencyInputBorder: { marginLeft: 0, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1F2937', marginBottom: 4 },

  wipeDataButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  wipeDataIcon: { marginRight: 8 },
  wipeDataText: { color: '#4B5563', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  // Modal Styles for Blood Group
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 14, 20, 0.8)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  modalContent: { width: '100%', backgroundColor: '#151A23', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#374151', maxHeight: '60%' },
  modalTitle: { color: '#E0E7FF', fontSize: 18, fontWeight: '700', marginBottom: 20 },
  modalItem: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  modalItemText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  modalCloseButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 30, backgroundColor: '#1E2430', borderRadius: 10, borderWidth: 1, borderColor: '#374151' },
  modalCloseText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
});