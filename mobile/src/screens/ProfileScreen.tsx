import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Firebase & API Import
import auth from '@react-native-firebase/auth';
import api from '../services/api';

// Icons Import
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  // Alerts State (CardioGuard Specific)
  const [isHighHRAlert, setIsHighHRAlert] = useState(true);
  const [isLowSpO2Alert, setIsLowSpO2Alert] = useState(true);

  // User Data State
  const [userData, setUserData] = useState({
    fullName: 'Loading...',
    bloodType: '--',
    age: '--',
    weight: '--',
    height: '--',
    profilePic: null as string | null,
  });

  // Fetching Data from PostgreSQL (useFocusEffect ke sath)
  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        const currentUser = auth().currentUser;
        if (currentUser?.uid) {
          try {
            const response = await api.get(`/user/${currentUser.uid}`);
            if (response.data) {
              setUserData({
                fullName: response.data.full_name || 'User',
                bloodType: response.data.blood_type || '--',
                age: response.data.age ? response.data.age.toString() : '--',
                weight: response.data.weight ? response.data.weight.toString() : '--',
                height: response.data.height ? response.data.height.toString() : '--',
                profilePic: response.data.profile_pic || null
              });
            }
          } catch (error) {
            console.log("Error fetching profile:", error);
          }
        }
      };

      fetchProfileData();
    }, [])
  );

  // Avatar Render Logic
  const renderAvatar = () => {
    if (userData.profilePic) {
      return (
        <Image source={{ uri: userData.profilePic }} style={styles.largeProfileImage} />
      );
    } else {
      const firstLetter = userData.fullName !== 'Loading...' ? userData.fullName.charAt(0).toUpperCase() : '';
      return (
        <View style={styles.placeholderAvatar}>
          <Text style={styles.placeholderText}>{firstLetter}</Text>
        </View>
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.log("Error signing out:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      {/* Clean Top Header */}
      <View style={styles.headerContainerClean}>
        <Text style={styles.headerLogoTextClean}>CardioGuard</Text>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Main Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {renderAvatar()}
          </View>
          
          <Text style={styles.userName}>{userData.fullName}</Text>
          <View style={styles.badgeRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color="#D1D5DB" />
            <Text style={styles.badgeText}>Premium Health Member</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Physical Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Blood Type</Text>
              <Text style={styles.metricValueGreen}>{userData.bloodType}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Age</Text>
              <Text style={styles.metricValue}>{userData.age}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Weight</Text>
              <Text style={styles.metricValue}>{userData.weight} <Text style={styles.metricUnit}>kg</Text></Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Height</Text>
              <Text style={styles.metricValue}>{userData.height} <Text style={styles.metricUnit}>cm</Text></Text>
            </View>
          </View>
        </View>

        {/* 2. Hardware Alerts Card */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Hardware Alerts</Text>

          {/* High HR Alert */}
          <View style={styles.listItemRow}>
            <View style={styles.listItemIconNoBg}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color="#FCA5A5" />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>High HR Alert</Text>
              <Text style={styles.listItemSub}>Notify if HR {'>'} 120bpm</Text>
            </View>
            <Switch
              trackColor={{ false: '#374151', true: '#4ADE80' }}
              thumbColor="#FFFFFF"
              value={isHighHRAlert}
              onValueChange={setIsHighHRAlert}
            />
          </View>

          {/* Low SpO2 Alert */}
          <View style={[styles.listItemRow, { marginTop: 24 }]}>
            <View style={styles.listItemIconNoBg}>
              <MaterialCommunityIcons name="weather-windy" size={24} color="#93C5FD" />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Low SpO2 Alert</Text>
              <Text style={styles.listItemSub}>Notify if Oxygen {'<'} 92%</Text>
            </View>
            <Switch
              trackColor={{ false: '#374151', true: '#4ADE80' }}
              thumbColor="#FFFFFF"
              value={isLowSpO2Alert}
              onValueChange={setIsLowSpO2Alert}
            />
          </View>
        </View>

        {/* 3. Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" style={styles.signOutIcon} />
          <Text style={styles.signOutText}>
            Sign out of {userData.fullName !== 'Loading...' ? userData.fullName.split(' ')[0] : 'your'} account
          </Text>
        </TouchableOpacity>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Feather name="home" size={20} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Reports')}
        >
          <Feather name="bar-chart-2" size={20} color="#6B7280" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>

        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity 
            style={styles.centerButton}
            onPress={() => navigation.navigate('AIPrediction')}
          >
            <MaterialCommunityIcons name="head-lightbulb-outline" size={28} color="#0B0E14" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('Fitness')}
        >
          <MaterialCommunityIcons name="dumbbell" size={20} color="#6B7280" />
          <Text style={styles.navText}>Fitness</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItemActive}
          onPress={() => navigation.navigate('Profile')}
        >
          <Feather name="user" size={20} color="#A5B4FC" />
          <Text style={styles.navTextActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0E14' },
  
  headerContainerClean: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15 },
  headerLogoTextClean: { color: '#E0E7FF', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  headerDivider: { height: 1, backgroundColor: '#1F2937', width: '100%' },
  
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  
  profileCard: { backgroundColor: '#151A23', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937', alignItems: 'center' },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#A5B4FC', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  largeProfileImage: { width: 86, height: 86, borderRadius: 43 },
  
  placeholderAvatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#A5B4FC', fontSize: 40, fontWeight: '700' },

  userName: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  badgeText: { color: '#D1D5DB', fontSize: 13, marginLeft: 6 },
  editProfileBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#374151', marginBottom: 24, backgroundColor: '#1E2430' },
  editProfileText: { color: '#A5B4FC', fontSize: 13, fontWeight: '600' },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  metricBox: { width: '48%', backgroundColor: '#0B0E14', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
  metricLabel: { color: '#D1D5DB', fontSize: 11, fontWeight: '600', marginBottom: 8 },
  metricValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  metricValueGreen: { color: '#4ADE80', fontSize: 24, fontWeight: '700' },
  metricUnit: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },

  sectionCard: { backgroundColor: '#151A23', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937' },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginLeft: 10 },
  
  listItemRow: { flexDirection: 'row', alignItems: 'center' },
  listItemIconNoBg: { width: 32, justifyContent: 'center', alignItems: 'center' },
  listItemContent: { flex: 1, marginLeft: 8 },
  listItemTitle: { color: '#E0E7FF', fontSize: 14, fontWeight: '500', marginBottom: 2 },
  listItemSub: { color: '#9CA3AF', fontSize: 12, lineHeight: 16, paddingRight: 10 },

  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 20, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: 20 },
  signOutIcon: { marginRight: 8 },
  signOutText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#1F2937', zIndex: 1 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.7 },
  navItemActive: { alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'rgba(129, 140, 248, 0.1)', paddingVertical: 10, borderRadius: 16, marginHorizontal: 8 },
  navText: { color: '#9CA3AF', fontSize: 12, marginTop: 4, fontWeight: '500' },
  navTextActive: { color: '#A5B4FC', fontSize: 12, fontWeight: '600', marginTop: 4 },
  
  centerButtonWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  centerButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#C7D2FE', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -30, shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10, zIndex: 100 },
});