import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import api from '../services/api';
import auth from '@react-native-firebase/auth';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NAYA: View All / View Less ke liye state
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    let isMounted = true; 

    const fetchData = async () => {
      const uid = auth().currentUser?.uid;
      if (!uid) return;

      try {
        setLoading(true);
        // Sirf events fetch kar rahe hain
        const fetchEventsPromise = api.get(`/events/${uid}`);
        const timeoutEvents = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        
        const eventsRes: any = await Promise.race([fetchEventsPromise, timeoutEvents]).catch(() => ({ data: [] }));
        
        if (isMounted) setEvents(eventsRes.data || []);

      } catch (error) {
        console.log("Error fetching data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();

    return () => { isMounted = false };
  }, []);

  // NAYA: Logic jo decide karegi ke kitne events dikhane hain
  const displayedEvents = showAllEvents ? events : events.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      <View style={styles.headerContainerClean}>
        <Text style={styles.headerLogoTextClean}>CardioGuard</Text>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.subHeading}>HEALTH ANALYTICS</Text>
        <Text style={styles.mainHeading}>Recent Reports</Text>

        {/* --- EVENTS LOG CARD --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Events Log</Text>
            
            {/* View All / View Less Button (Sirf tab show hoga agar 5 se zyada events hon) */}
            {events.length > 5 && (
              <TouchableOpacity onPress={() => setShowAllEvents(!showAllEvents)}>
                <Text style={styles.linkText}>
                  {showAllEvents ? 'View Less' : 'View All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color="#A5B4FC" size="small" style={{ marginVertical: 20 }} />
          ) : events.length > 0 ? (
            displayedEvents.map((event, index) => {
              const dateObj = new Date(event.timestamp);
              const formattedTime = `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getDate()} • ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              
              return (
                <TouchableOpacity key={index} style={styles.eventItem}>
                  <View style={[styles.eventIconBox, { backgroundColor: 'rgba(220, 38, 38, 0.15)' }]}>
                    <Feather name="alert-triangle" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.eventTextContent}>
                    <Text style={styles.eventTitle}>{event.issue}</Text>
                    <Text style={styles.eventTime}>{formattedTime} | HR: {event.heart_rate} | SpO2: {event.spo2}%</Text>
                  </View>
                  <View style={styles.tagCritical}>
                    <Text style={styles.tagCriticalText}>CRITICAL</Text>
                  </View>
                </TouchableOpacity>
              )
            })
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Feather name="check-circle" size={40} color="#4ADE80" style={{ marginBottom: 10 }} />
              <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>No critical events detected. Your health is stable!</Text>
            </View>
          )}
        </View>

        {/* --- AI INSIGHT CARD --- */}
        <View style={styles.aiInsightWrapper}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} 
            style={styles.aiInsightBg}
            imageStyle={{ opacity: 0.2, borderRadius: 16 }}
          >
            <Text style={styles.aiInsightTitle}>AI Insight</Text>
            <Text style={styles.aiInsightDesc}>
              {events.length > 0 
                ? `We detected ${events.length} abnormal events recently. Run a full AI scan to get a detailed clinical assessment.` 
                : `No critical events found. Keep up the healthy lifestyle! Run a scan anytime if you feel unwell.`}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AIPrediction')}>
              <Text style={styles.aiLinkText}>Run Full AI Scan</Text>
            </TouchableOpacity>
          </ImageBackground>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Feather name="home" size={20} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItemActive}>
          <Feather name="bar-chart-2" size={20} color="#818CF8" />
          <Text style={styles.navTextActive}>Reports</Text>
        </TouchableOpacity>

        <View style={styles.centerButtonWrapper}>
          <TouchableOpacity style={styles.centerButton} onPress={() => navigation.navigate('AIPrediction')}>
            <MaterialCommunityIcons name="head-lightbulb-outline" size={28} color="#0B0E14" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Fitness')}>
          <MaterialCommunityIcons name="dumbbell" size={20} color="#6B7280" />
          <Text style={styles.navText}>Fitness</Text>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  
  subHeading: { color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  mainHeading: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginBottom: 24 },
  
  card: { backgroundColor: '#151A23', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  linkText: { color: '#A5B4FC', fontSize: 14, fontWeight: '500', padding: 5 },
  
  eventItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E2430', borderRadius: 14, padding: 14, marginBottom: 10 },
  eventIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  eventTextContent: { flex: 1 },
  eventTitle: { color: '#E0E7FF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  eventTime: { color: '#9CA3AF', fontSize: 12 },
  tagCritical: { backgroundColor: '#B91C1C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagCriticalText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  
  aiInsightWrapper: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1F2937', marginTop: 10 },
  aiInsightBg: { backgroundColor: '#111827', padding: 24 },
  aiInsightTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  aiInsightDesc: { color: '#D1D5DB', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  aiLinkText: { color: '#A5B4FC', fontSize: 14, fontWeight: '600' },
  
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#1F2937', zIndex: 1 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navItemActive: { alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'rgba(129, 140, 248, 0.1)', paddingVertical: 8, borderRadius: 12, marginHorizontal: 10 },
  navText: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  navTextActive: { color: '#818CF8', fontSize: 12, fontWeight: '600', marginTop: 4 },
  centerButtonWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  centerButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#C7D2FE', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -30, shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10, zIndex: 100 },
});