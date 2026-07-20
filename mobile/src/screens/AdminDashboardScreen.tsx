import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, TextInput, Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'PATIENTS' | 'INVENTORY'>('PATIENTS');
  const [newDeviceId, setNewDeviceId] = useState('');
  
  // Modal States
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientEvents, setPatientEvents] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      const patientsRes = await api.get('/admin/patients');
      const devicesRes = await api.get('/admin/devices'); 
      
      setStats(statsRes.data);
      setPatients(patientsRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      Alert.alert("Error", "Could not connect to Admin Server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // --- ACTIONS ---

  const handleAddDevice = async () => {
    if (!newDeviceId.trim()) {
      Alert.alert("Required", "Please enter a Device MAC/ID.");
      return;
    }
    try {
      await api.post(`/admin/add-device/${newDeviceId.trim()}`);
      Alert.alert("Success", "New device added to inventory!");
      setNewDeviceId('');
      fetchAdminData();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.detail || "Failed to add device.");
    }
  };

  const handleUnlinkDevice = async (deviceId: string) => {
    try {
      await api.post(`/admin/unlink-device/${deviceId}`);
      Alert.alert("Success", "Device unlinked and moved to free inventory.");
      fetchAdminData(); 
    } catch (e) {
      Alert.alert("Error", "Failed to unlink device.");
    }
  };

  const handleDeletePatient = async (uid: string) => {
    Alert.alert("WARNING", "Permanently delete this patient?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/admin/delete-patient/${uid}`);
            fetchAdminData(); 
          } catch (e) {
            Alert.alert("Error", "Failed to delete patient.");
          }
        }
      }
    ]);
  };

  // NAYA: Smart Parallel Data Fetching
  const openHealthReport = (patient: any) => {
    setSelectedPatient(patient);
    setLoadingEvents(true);
    setLoadingReport(true);
    setAiReport(null);
    setPatientEvents([]);

    // 1. Fetch Events (Takes milliseconds)
    api.get(`/events/${patient.uid}`)
      .then(res => {
        setPatientEvents(res.data);
        setLoadingEvents(false);
      })
      .catch(() => {
        setLoadingEvents(false);
      });

    // 2. Fetch AI Report (Takes 5-10 seconds)
    api.get(`/generate-report/${patient.uid}?alert_reason=ADMIN_VIEW`)
      .then(res => {
        setAiReport(res.data.prediction);
        setLoadingReport(false);
      })
      .catch(() => {
        setLoadingReport(false);
      });
  };

  const getRiskColor = (risk: string) => {
    switch(risk?.toUpperCase()) {
      case 'CRITICAL': return '#EF4444';
      case 'HIGH': return '#F97316';
      case 'MODERATE': return '#FBBF24';
      case 'LOW': return '#34D399';
      default: return '#A5B4FC';
    }
  };

  // --- RENDERERS ---

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Initializing Admin Console...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="log-out" size={24} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Admin</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Top Stats Overview */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{stats?.total_patients || 0}</Text>
          <Text style={styles.overviewLabel}>Patients</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{stats?.active_devices || 0}</Text>
          <Text style={styles.overviewLabel}>Active Units</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: '#34D399' }]}>{stats?.free_devices || 0}</Text>
          <Text style={styles.overviewLabel}>Free Stock</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'PATIENTS' && styles.activeTab]} 
          onPress={() => setActiveTab('PATIENTS')}
        >
          <Text style={[styles.tabText, activeTab === 'PATIENTS' && styles.activeTabText]}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'INVENTORY' && styles.activeTab]} 
          onPress={() => setActiveTab('INVENTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'INVENTORY' && styles.activeTabText]}>Inventory</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* ========================================== */}
        {/* PATIENTS TAB */}
        {/* ========================================== */}
        {activeTab === 'PATIENTS' && (
          <View>
            {patients.map((patient, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.patientHeaderRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{patient.full_name.charAt(0)}</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.cardTitle}>{patient.full_name}</Text>
                    <Text style={styles.cardSubtitle}>{patient.email} • Age: {patient.age}</Text>
                  </View>
                </View>

                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: patient.device_id !== "No Device Linked" ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                    <Text style={[styles.badgeText, { color: patient.device_id !== "No Device Linked" ? '#34D399' : '#EF4444' }]}>
                      Device: {patient.device_id}
                    </Text>
                  </View>
                </View>

                {/* Primary Action */}
                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => openHealthReport(patient)}>
                  <Feather name="activity" size={18} color="#1E3A8A" />
                  <Text style={styles.primaryActionText}>View Health Report</Text>
                </TouchableOpacity>

                {/* Secondary Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#1F2937' }]} 
                    onPress={() => handleUnlinkDevice(patient.device_id)}
                    disabled={patient.device_id === "No Device Linked"}
                  >
                    <Text style={styles.actionBtnText}>Unlink Device</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    onPress={() => handleDeletePatient(patient.uid)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {patients.length === 0 && <Text style={styles.emptyText}>No patients registered yet.</Text>}
          </View>
        )}

        {/* ========================================== */}
        {/* INVENTORY TAB */}
        {/* ========================================== */}
        {activeTab === 'INVENTORY' && (
          <View>
            <View style={styles.addDeviceCard}>
              <Text style={styles.inputLabel}>REGISTER NEW HARDWARE</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.deviceInput}
                  placeholder="e.g. ESP-8266-MAC"
                  placeholderTextColor="#4B5563"
                  value={newDeviceId}
                  onChangeText={setNewDeviceId}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddDevice}>
                  <Feather name="plus" size={20} color="#1E3A8A" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {devices.map((device, index) => (
              <View key={index} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <Feather name="cpu" size={20} color="#A5B4FC" />
                  <Text style={styles.deviceTitle}>{device.device_id}</Text>
                </View>
                <View style={styles.deviceStatusRow}>
                  {device.owner_uid ? (
                    <Text style={styles.deviceOwner}>Linked to: <Text style={{color: '#FFF'}}>{device.owner_name}</Text></Text>
                  ) : (
                    <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>AVAILABLE IN STOCK</Text></View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========================================== */}
      {/* PATIENT HEALTH REPORT MODAL */}
      {/* ========================================== */}
      <Modal visible={!!selectedPatient} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPatient?.full_name}'s Report</Text>
              <TouchableOpacity onPress={() => setSelectedPatient(null)}>
                <Feather name="x-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              
              {/* --- 1. AI PREDICTION CARD --- */}
              <Text style={styles.sectionTitle}>AI Cardiac Assessment</Text>
              {loadingReport ? (
                <View style={styles.aiLoadingCard}>
                  <ActivityIndicator size="small" color="#A5B4FC" />
                  <Text style={styles.aiLoadingText}>Generating clinical analysis...</Text>
                </View>
              ) : aiReport ? (
                <View style={[styles.aiReportCard, { borderColor: getRiskColor(aiReport.risk_level) }]}>
                  <View style={styles.riskRow}>
                    <Text style={styles.riskLabel}>Cardiac Risk Level:</Text>
                    <Text style={[styles.riskValue, { color: getRiskColor(aiReport.risk_level) }]}>
                      {aiReport.risk_level?.toUpperCase()} ({aiReport.risk_score_percentage}%)
                    </Text>
                  </View>
                  
                  <Text style={styles.summaryTitle}>Clinical Summary:</Text>
                  <Text style={styles.summaryText}>{aiReport.clinical_summary}</Text>
                  
                  <Text style={styles.summaryTitle}>Recommendations:</Text>
                  {aiReport.recommendations?.map((rec: string, i: number) => (
                    <Text key={i} style={styles.recText}>• {rec}</Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Failed to load AI Assessment.</Text>
              )}

              {/* --- 2. CRITICAL ALERTS LIST --- */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Critical Alerts</Text>
              {loadingEvents ? (
                <ActivityIndicator size="small" color="#EF4444" style={{ marginTop: 20 }} />
              ) : (
                <View>
                  {patientEvents.length === 0 ? (
                    <Text style={styles.emptyText}>No dangerous events recorded. Patient is healthy!</Text>
                  ) : (
                    patientEvents.map((ev, idx) => (
                      <View key={idx} style={styles.eventCard}>
                        <View style={styles.eventHeader}>
                          <Text style={styles.eventIssue}>{ev.issue}</Text>
                          <Text style={styles.eventDate}>{new Date(ev.timestamp).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.eventStatsRow}>
                          <Text style={styles.eventStat}>HR: <Text style={{color: '#EF4444', fontWeight: 'bold'}}>{ev.heart_rate} bpm</Text></Text>
                          <Text style={styles.eventStat}>SpO2: <Text style={{color: '#34D399', fontWeight: 'bold'}}>{ev.spo2}%</Text></Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14' },
  loadingContainer: { flex: 1, backgroundColor: '#0B0E14', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#EF4444', marginTop: 15, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 5, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  
  overviewContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  overviewCard: { flex: 1, backgroundColor: '#15171C', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#262A36', marginHorizontal: 4, alignItems: 'center' },
  overviewValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  overviewLabel: { color: '#9CA3AF', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#1F2937' },
  activeTab: { borderBottomColor: '#A5B4FC' },
  tabText: { color: '#6B7280', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  activeTabText: { color: '#A5B4FC' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Card Styles
  card: { backgroundColor: '#15171C', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#262A36' },
  patientHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#A5B4FC', fontSize: 18, fontWeight: 'bold' },
  patientInfo: { flex: 1 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  
  badgeRow: { marginBottom: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  primaryActionBtn: { backgroundColor: '#A5B4FC', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, marginBottom: 12 },
  primaryActionText: { color: '#1E3A8A', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  actionBtnText: { color: '#D1D5DB', fontSize: 13, fontWeight: '600' },

  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 20, fontSize: 14 },

  // Inventory Styles
  addDeviceCard: { backgroundColor: '#15171C', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#374151', borderStyle: 'dashed' },
  inputLabel: { color: '#D1D5DB', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  inputRow: { flexDirection: 'row' },
  deviceInput: { flex: 1, backgroundColor: '#0B0E14', color: '#FFF', paddingHorizontal: 15, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#262A36', marginRight: 10 },
  addBtn: { backgroundColor: '#A5B4FC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  addBtnText: { color: '#1E3A8A', fontWeight: 'bold', marginLeft: 5 },

  deviceCard: { backgroundColor: '#15171C', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#262A36' },
  deviceHeader: { flexDirection: 'row', alignItems: 'center' },
  deviceTitle: { color: '#E0E7FF', fontSize: 15, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.5 },
  deviceStatusRow: { alignItems: 'flex-end' },
  deviceOwner: { color: '#9CA3AF', fontSize: 12 },
  freeBadge: { backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  freeBadgeText: { color: '#34D399', fontSize: 10, fontWeight: 'bold' },

  // Modal & AI Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#15171C', height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#262A36' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { color: '#A5B4FC', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  
  aiLoadingCard: { backgroundColor: '#0B0E14', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937', marginBottom: 15 },
  aiLoadingText: { color: '#A5B4FC', marginTop: 10, fontSize: 13 },
  aiReportCard: { backgroundColor: '#0B0E14', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  riskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  riskLabel: { color: '#D1D5DB', fontSize: 15, fontWeight: 'bold' },
  riskValue: { fontSize: 18, fontWeight: '900' },
  summaryTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
  summaryText: { color: '#FFF', fontSize: 14, lineHeight: 22, marginBottom: 15 },
  recText: { color: '#D1D5DB', fontSize: 13, lineHeight: 20, marginBottom: 5 },

  eventCard: { backgroundColor: '#0B0E14', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1F2937' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  eventIssue: { color: '#EF4444', fontSize: 15, fontWeight: 'bold', flex: 1 },
  eventDate: { color: '#6B7280', fontSize: 12 },
  eventStatsRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  eventStat: { color: '#D1D5DB', fontSize: 13, marginRight: 20 },
});