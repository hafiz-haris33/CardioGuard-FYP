import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle, G } from 'react-native-svg';

// Icons Import
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { useBLE } from '../context/BLEContext';

const { width } = Dimensions.get('window');

export default function FitnessScreen() {
  const navigation = useNavigation<any>();

  // Fetching LIVE data from BLE Context
  const { isConnected, steps, calories, activeMinutes } = useBLE();

  // Activity Rings Goals
  const GOAL_CALORIES = 500;
  const GOAL_STEPS = 10000;
  const GOAL_MINUTES = 60;

  // Calculating SVG Dash Offsets dynamically
  const redOffset = 471 - (Math.min(calories, GOAL_CALORIES) / GOAL_CALORIES) * 471;
  const greenOffset = 345 - (Math.min(steps, GOAL_STEPS) / GOAL_STEPS) * 345;
  const blueOffset = 219 - (Math.min(activeMinutes, GOAL_MINUTES) / GOAL_MINUTES) * 219;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      <View style={styles.headerContainerClean}>
        <Text style={styles.headerLogoTextClean}>CardioGuard</Text>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Activity Rings Card (NOW REAL-TIME) */}
        <View style={[styles.card, { opacity: isConnected ? 1 : 0.5 }]}>
          <View style={styles.activityHeader}>
            <Text style={styles.cardTitle}>Activity</Text>
            <Text style={styles.cardSubtitle}>
              {isConnected ? "Live Tracking Active" : "Device Disconnected"}
            </Text>
          </View>
          
          <View style={styles.ringsContainer}>
            <Svg width="220" height="220" viewBox="0 0 200 200">
              <G rotation="-90" origin="100, 100">
                {/* Red Ring (Calories) */}
                <Circle cx="100" cy="100" r="75" stroke="rgba(255, 75, 75, 0.15)" strokeWidth="18" fill="none" />
                <Circle cx="100" cy="100" r="75" stroke="#FF4B4B" strokeWidth="18" fill="none" strokeDasharray="471" strokeDashoffset={redOffset} strokeLinecap="round" />
                
                {/* Green Ring (Steps) */}
                <Circle cx="100" cy="100" r="55" stroke="rgba(74, 222, 128, 0.15)" strokeWidth="18" fill="none" />
                <Circle cx="100" cy="100" r="55" stroke="#4ADE80" strokeWidth="18" fill="none" strokeDasharray="345" strokeDashoffset={greenOffset} strokeLinecap="round" />
                
                {/* Blue Ring (Active Min) */}
                <Circle cx="100" cy="100" r="35" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="18" fill="none" />
                <Circle cx="100" cy="100" r="35" stroke="#3B82F6" strokeWidth="18" fill="none" strokeDasharray="219" strokeDashoffset={blueOffset} strokeLinecap="round" />
              </G>
            </Svg>
            <View style={styles.ringsCenterIcon}>
              <MaterialCommunityIcons name="dumbbell" size={28} color="#4B5563" />
            </View>
          </View>

          <View style={styles.activityStatsRow}>
            <View style={styles.statColumn}>
              <Text style={[styles.statLabel, { color: '#FF4B4B' }]}>Move</Text>
              <Text style={styles.statValue}>{isConnected ? calories : 0} <Text style={styles.statUnit}>KCAL</Text></Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={[styles.statLabel, { color: '#4ADE80' }]}>Steps</Text>
              <Text style={styles.statValue}>
                {isConnected ? (steps >= 1000 ? (steps / 1000).toFixed(1) + 'k' : steps) : 0}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={[styles.statLabel, { color: '#93C5FD' }]}>Active</Text>
              <Text style={styles.statValue}>{isConnected ? activeMinutes : 0} <Text style={styles.statUnit}>MIN</Text></Text>
            </View>
          </View>
        </View>

        {/* 2. HR Recovery Card */}
        <View style={styles.card}>
          <View style={styles.hrRecoveryHeader}>
            <View style={styles.rowCenter}>
              <Feather name="heart" size={18} color="#FCA5A5" />
              <Text style={styles.cardTitleSmall}>HR Recovery</Text>
            </View>
            <Text style={styles.hrRecoveryBpm}>+12 bpm</Text>
          </View>
          
          <View style={styles.recoveryBarsRow}>
            <View style={styles.recoveryBarWrapper}><View style={[styles.recoveryBarFill, { height: '100%' }]} /></View>
            <View style={styles.recoveryBarWrapper}><View style={[styles.recoveryBarFill, { height: '75%' }]} /></View>
            <View style={styles.recoveryBarWrapper}><View style={[styles.recoveryBarFill, { height: '50%' }]} /></View>
            <View style={styles.recoveryBarWrapper}><View style={[styles.recoveryBarFill, { height: '35%' }]} /></View>
            <View style={styles.recoveryBarWrapper}><View style={[styles.recoveryBarFill, { height: '20%' }]} /></View>
          </View>
          
          <Text style={styles.infoText}>
            Recovery rate is optimal. Your heart returned to resting state 15% faster than average.
          </Text>
        </View>

        {/* 3. Training Load Card */}
        <View style={styles.card}>
          <View style={styles.trainingHeader}>
            <Text style={styles.cardTitleSmallWhite}>Training Load</Text>
            <Feather name="activity" size={16} color="#A5B4FC" />
          </View>
          <Text style={styles.trainingTitleMain}>Optimal</Text>
          
          <View style={styles.trainingProgressBarBg}>
            <View style={styles.trainingProgressBarFill} />
          </View>
          
          <View style={styles.trainingLabelsRow}>
            <Text style={styles.trainingLabel}>LOW</Text>
            <Text style={styles.trainingLabel}>STEADY</Text>
            <Text style={styles.trainingLabel}>HIGH</Text>
          </View>
        </View>

        {/* 4. Recent Workouts */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.workoutItem}>
          <View style={[styles.workoutIconBox, { backgroundColor: 'rgba(22, 101, 52, 0.4)' }]}>
            <FontAwesome5 name="walking" size={20} color="#4ADE80" />
          </View>
          <View style={styles.workoutTextContent}>
            <Text style={styles.workoutTitle}>Morning Walk</Text>
            <Text style={styles.workoutSubtitle}>3.2 km • 35:15</Text>
          </View>
          <View style={styles.workoutStatsRight}>
            <Text style={styles.workoutCal}>240 <Text style={styles.workoutCalUnit}>kcal</Text></Text>
            <Text style={styles.workoutTime}>8:32 AM</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.workoutItem}>
          <View style={[styles.workoutIconBox, { backgroundColor: 'rgba(30, 58, 138, 0.4)' }]}>
            <MaterialCommunityIcons name="dumbbell" size={20} color="#93C5FD" />
          </View>
          <View style={styles.workoutTextContent}>
            <Text style={styles.workoutTitle}>Light Exercise</Text>
            <Text style={styles.workoutSubtitle}>25:00 • Avg HR 115</Text>
          </View>
          <View style={styles.workoutStatsRight}>
            <Text style={styles.workoutCal}>210 <Text style={styles.workoutCalUnit}>kcal</Text></Text>
            <Text style={styles.workoutTime}>Yesterday</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Feather name="home" size={20} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reports')}>
          <Feather name="bar-chart-2" size={20} color="#6B7280" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>

        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity style={styles.centerButton} onPress={() => navigation.navigate('AIPrediction')}>
            <MaterialCommunityIcons name="head-lightbulb-outline" size={28} color="#0B0E14" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation.navigate('Fitness')}>
          <MaterialCommunityIcons name="dumbbell" size={20} color="#A5B4FC" />
          <Text style={styles.navTextActive}>Fitness</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Feather name="user" size={20} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
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
  card: { backgroundColor: '#151A23', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937' },
  activityHeader: { marginBottom: 20 },
  cardTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { color: '#9CA3AF', fontSize: 13 },
  ringsContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', height: 220, marginBottom: 20 },
  ringsCenterIcon: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  activityStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  statColumn: { alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statValue: { color: '#F9FAFB', fontSize: 20, fontWeight: '700' },
  statUnit: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: '#374151' },
  hrRecoveryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  cardTitleSmall: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  hrRecoveryBpm: { color: '#4ADE80', fontSize: 14, fontWeight: '700' },
  recoveryBarsRow: { flexDirection: 'row', justifyContent: 'space-between', height: 80, marginBottom: 20 },
  recoveryBarWrapper: { flex: 1, backgroundColor: '#2D282E', marginHorizontal: 4, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  recoveryBarFill: { backgroundColor: '#FCA5A5', width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  infoText: { color: '#D1D5DB', fontSize: 14, lineHeight: 22 },
  trainingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitleSmallWhite: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  trainingTitleMain: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginBottom: 20 },
  trainingProgressBarBg: { height: 8, backgroundColor: '#374151', borderRadius: 4, marginBottom: 10 },
  trainingProgressBarFill: { height: '100%', width: '55%', backgroundColor: '#67E8F9', borderRadius: 4 },
  trainingLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trainingLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  viewAllText: { color: '#A5B4FC', fontSize: 13, fontWeight: '600' },
  workoutItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151A23', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
  workoutIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  workoutTextContent: { flex: 1 },
  workoutTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  workoutSubtitle: { color: '#9CA3AF', fontSize: 12 },
  workoutStatsRight: { alignItems: 'flex-end' },
  workoutCal: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  workoutCalUnit: { color: '#6B7280', fontSize: 10, fontWeight: '600' },
  workoutTime: { color: '#9CA3AF', fontSize: 12 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#1F2937', zIndex: 1 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.7 },
  navItemActive: { alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'rgba(129, 140, 248, 0.1)', paddingVertical: 10, borderRadius: 16, marginHorizontal: 8 },
  navText: { color: '#9CA3AF', fontSize: 12, marginTop: 4, fontWeight: '500' },
  navTextActive: { color: '#A5B4FC', fontSize: 12, fontWeight: '600', marginTop: 4 },
  centerButtonWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  centerButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#C7D2FE', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -30, shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10, zIndex: 100 },
});