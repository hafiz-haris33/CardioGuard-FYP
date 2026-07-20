import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors, spacing } from '../utils/theme';
import { ECGGraph } from '../components/ECGGraph';
import { PPGGraph } from '../components/PPGGraph';
import { IMUGraph } from '../components/IMUGraph';
import { MetricCard } from '../components/MetricCard';
import { useBLE } from '../context/BLEContext';
import auth from '@react-native-firebase/auth';
import api from '../services/api';

type RootStackParamList = {
  Dashboard: undefined; Bluetooth: undefined; Reports: undefined; AIPrediction: undefined; Fitness: undefined; Profile: undefined;
};

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Dashboard'>>();
  const [userName, setUserName] = useState('User');
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const { 
    isConnected, connectedDevice, ecgRender, ppgRender, imuRender, 
    flags, ppgHeart, liveSpO2, motionState, 
    isMonitoringActive, toggleMonitoring, ecgStatus // NAYA: ecgStatus import
  } = useBLE();

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const currentUser = auth().currentUser;
        if (currentUser?.uid) {
          try {
            const response = await api.get(`/user/${currentUser.uid}`);
            if (response.data) {
              setUserName(response.data.full_name?.split(' ')[0] || 'User');
              setProfilePic(response.data.profile_pic || null);
            }
          } catch (error) {}
        }
      };
      fetchUserData();
    }, [])
  );

  // NAYA: Helper function to get dynamic colors based on ECG status
  const getStatusColor = (status: string) => {
    if (status.includes('Normal')) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: '#10B981' };
    if (status.includes('Abnormal')) return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' };
    if (status.includes('Weak') || status.includes('Leads Off')) return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B' };
    return { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF', border: '#6B7280' }; // Standby/Disconnected
  };

  const ecgStatusColors = getStatusColor(ecgStatus);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      <View style={styles.headerContainer}>
        <View style={styles.profileSection}>
          {profilePic ? <Image source={{ uri: profilePic }} style={styles.profileImage} /> : <View style={styles.placeholderAvatar}><Text style={styles.placeholderText}>{userName.charAt(0).toUpperCase()}</Text></View>}
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingSubText}>Welcome back,</Text>
            <Text style={styles.greetingText}>{userName}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.bluetoothBtn, { backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]} 
           onPress={() => navigation.navigate('Bluetooth')}
        >
          <MaterialCommunityIcons name={isConnected ? "bluetooth-connect" : "bluetooth-off"} size={22} color={isConnected ? '#4ADE80' : '#FCA5A5'} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {isConnected && (
          <TouchableOpacity 
            style={[styles.monitoringBtn, isMonitoringActive ? styles.monitoringActive : styles.monitoringInactive]} 
            onPress={toggleMonitoring}
          >
            <Feather name={isMonitoringActive ? "activity" : "play-circle"} size={20} color="#FFF" />
            <Text style={styles.monitoringBtnText}>
              {isMonitoringActive ? "Monitoring Session Active (Stop)" : "Start Monitoring Session"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.insightBox}>
          <Text style={styles.insightTitle}>{isMonitoringActive ? "System Live" : "System Standby"}</Text>
          <Text style={styles.insightDesc}>
            {isMonitoringActive 
              ? "Chest sensor is streaming real-time data. Abnormal vitals will be recorded." 
              : isConnected ? "Device connected. Press 'Start' to begin monitoring session." : "Bluetooth device not connected."}
          </Text>
        </View>

        {/* NAYA: ECG Graph wrapper with Dynamic Status Badge */}
        <View style={styles.graphSection}>
          <View style={styles.graphHeader}>
            <Text style={styles.sectionTitle}>Electrocardiogram (ECG)</Text>
            <View style={[styles.statusBadge, { backgroundColor: ecgStatusColors.bg, borderColor: ecgStatusColors.border }]}>
              <Text style={[styles.statusText, { color: ecgStatusColors.text }]}>{ecgStatus}</Text>
            </View>
          </View>
          <ECGGraph 
            waveform={isMonitoringActive ? ecgRender : []} 
            leadsOn={isConnected && flags.leads_on} 
          />
        </View>

        <PPGGraph 
          waveform={isMonitoringActive ? ppgRender : []} 
          fingerOn={isConnected && flags.finger_on} 
          calibrated={isConnected && flags.calibrated} 
          instantBpm={isMonitoringActive ? ppgHeart.instant : null} 
          avgBpm={isMonitoringActive ? ppgHeart.avg : null} 
          connectionState={isConnected ? 'connected' : 'disconnected'} 
        />
        <IMUGraph 
          ax={isMonitoringActive ? imuRender.ax : []} 
          ay={isMonitoringActive ? imuRender.ay : []} 
          az={isMonitoringActive ? imuRender.az : []} 
          motion={isMonitoringActive && flags.motion} 
        />

        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <View style={{ flex: 1 }}>
              <MetricCard icon={<Text style={styles.icon}>❤️</Text>} label="Live HR" value={isMonitoringActive && ppgHeart.instant != null ? Math.round(ppgHeart.instant) : '--'} unit="BPM" />
            </View>
            <View style={{ flex: 1 }}>
              <MetricCard icon={<Text style={styles.icon}>💧</Text>} label="SpO2" value={isMonitoringActive && liveSpO2 > 0 ? liveSpO2 : '--'} unit="%" />
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={{ flex: 1 }}>
              <MetricCard icon={<Text style={styles.icon}>📊</Text>} label="Avg HR" value={isMonitoringActive && ppgHeart.avg != null ? Math.round(ppgHeart.avg) : '--'} unit="BPM" />
            </View>
            <View style={{ flex: 1 }}>
              <MetricCard icon={<Text style={styles.icon}>🏃</Text>} label="Motion" value={isMonitoringActive ? motionState : 'Offline'} />
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation.navigate('Dashboard')}><Feather name="home" size={20} color="#818CF8" /><Text style={styles.navTextActive}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reports')}><Feather name="bar-chart-2" size={20} color="#6B7280" /><Text style={styles.navText}>Reports</Text></TouchableOpacity>
        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity style={styles.centerButton} onPress={() => navigation.navigate('AIPrediction')}><MaterialCommunityIcons name="head-lightbulb-outline" size={28} color="#0B0E14" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Fitness')}><MaterialCommunityIcons name="dumbbell" size={20} color="#6B7280" /><Text style={styles.navText}>Fitness</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}><Feather name="user" size={20} color="#6B7280" /><Text style={styles.navText}>Profile</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0E14' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#1F2937' },
  placeholderAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  placeholderText: { color: '#A5B4FC', fontSize: 20, fontWeight: '700' },
  greetingTextContainer: { marginLeft: 14 }, greetingSubText: { color: '#9CA3AF', fontSize: 12, fontWeight: '500', marginBottom: 2 },
  greetingText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  bluetoothBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(55, 65, 81, 0.5)' },
  headerDivider: { height: 1, backgroundColor: '#1F2937', width: '100%' },
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  monitoringBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginBottom: 15, gap: 8 },
  monitoringActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: '#10B981' },
  monitoringInactive: { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1, borderColor: '#3B82F6' },
  monitoringBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  insightBox: { backgroundColor: '#151A23', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1F2937' },
  insightTitle: { color: '#A5B4FC', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  insightDesc: { color: '#D1D5DB', fontSize: 14 },
  
  // NAYA: Graph Header and Status Badge Styles
  graphSection: { marginBottom: 15 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 },
  sectionTitle: { color: '#E5E7EB', fontSize: 16, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },

  metricsGrid: { marginVertical: 10 }, metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 }, icon: { fontSize: 24 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#1F2937', zIndex: 1 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 }, navItemActive: { alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'rgba(129, 140, 248, 0.1)', paddingVertical: 8, borderRadius: 12 },
  navText: { color: '#6B7280', fontSize: 12, marginTop: 4 }, navTextActive: { color: '#818CF8', fontSize: 12, fontWeight: '600', marginTop: 4 },
  centerButtonWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  centerButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#C7D2FE', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -30, shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10, zIndex: 100 },
});