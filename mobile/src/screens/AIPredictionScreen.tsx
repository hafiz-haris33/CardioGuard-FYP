import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// Libraries for API & File Management
import api from '../services/api';
import auth from '@react-native-firebase/auth';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

// Icons Import
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AIPredictionScreen() {
  const navigation = useNavigation<any>();

  // States for AI Data and PDF
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  // Function to call AI API
  const handlePredict = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/generate-report/${uid}`);
      if (res.data.status === "success") {
        setAiData(res.data.prediction);
        setPdfBase64(res.data.pdf_base64);
      }
    } catch (error: any) {
      console.log("Prediction Error:", error);
      Alert.alert("Analysis Failed", "Could not reach the CardioGuard Neural Engine. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Function to save and share PDF safely on Android/iOS
  const sharePDF = async () => {
    if (!pdfBase64) {
      Alert.alert("Hold On", "PDF data is not ready yet.");
      return;
    }
    
    try {
      // 1. Agar string mein 'data:application/pdf;base64,' laga hai to usay hatayen
      const cleanBase64 = pdfBase64.replace('data:application/pdf;base64,', '');
      
      // 2. Cache directory use karen (Is ke liye storage permission nahi chahiye hoti)
      const filepath = `${RNFS.CachesDirectoryPath}/CardioGuard_Report.pdf`;
      
      // 3. File ko Cache mein save karen
      await RNFS.writeFile(filepath, cleanBase64, 'base64');
      
      // 4. File ka asli path Share dialog ko bhej den
      await Share.open({
        url: `file://${filepath}`,
        type: 'application/pdf',
        title: 'CardioGuard Medical Report',
        filename: 'CardioGuard_Report'
      });

    } catch (error: any) {
      console.log("PDF Share Error:", error);
      // Agar user khud share dialog band kar de to error show na karen
      if (error.message !== "User did not share") {
        Alert.alert("Share Error", "PDF open karne mein masla aaya: " + error.message);
      }
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
        
        {/* Terminal/Console Card */}
        <View style={styles.terminalCard}>
          <View style={styles.terminalLeftBorder} />
          
          <View style={styles.terminalHeader}>
            <View style={styles.terminalHeaderLeft}>
              <MaterialCommunityIcons name="console-network" size={16} color="#4ADE80" />
              <Text style={styles.terminalHeaderText}>ACTIVE ANALYSIS ENGINE</Text>
            </View>
            <View style={styles.terminalDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>

          <View style={styles.terminalBody}>
            <Text style={styles.terminalLine}>
              <Text style={styles.terminalCaret}>{'> '}</Text>
              <Text style={styles.terminalLabel}>SYSTEM_STATUS:</Text>
            </Text>
            <Text style={styles.terminalValueGreen}>
              {loading ? "PROCESSING_DATA..." : "READY"}
            </Text>

            <Text style={[styles.terminalLine, styles.marginTop8]}>
              <Text style={styles.terminalCaret}>{'> '}</Text>
              <Text style={styles.terminalLabel}>CLINICAL_SUMMARY: </Text>
            </Text>
            <Text style={styles.terminalNormal}>
              {aiData ? aiData.clinical_summary : "Awaiting user trigger to initiate AI risk assessment scan."}
            </Text>
          </View>
        </View>

        {/* Main Heart AI Graphic */}
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          style={styles.aiGraphicContainer}
          imageStyle={{ borderRadius: 16, opacity: 0.8 }}
        >
          <View style={styles.aiGraphicOverlay}>
            <Text style={styles.analysisCompleteText}>
              {aiData ? "ANALYSIS COMPLETE" : "SCAN PENDING"}
            </Text>
            
            <Text style={[styles.percentageText, { color: aiData?.risk_level === 'Critical' || aiData?.risk_level === 'High' ? '#EF4444' : '#FFFFFF' }]}>
              {aiData ? `${aiData.risk_score_percentage}%` : "--%"}
            </Text>
            
            <Text style={styles.optimalText}>
              {aiData ? `Risk Level: ${aiData.risk_level.toUpperCase()}` : "Awaiting Data"}
            </Text>
          </View>
        </ImageBackground>

        {/* Gradient Predict / PDF Button */}
        <TouchableOpacity 
          style={styles.predictButtonWrapper}
          onPress={aiData ? sharePDF : handlePredict}
          disabled={loading}
        >
          <LinearGradient
            colors={aiData ? ['#818CF8', '#A5B4FC'] : ['#4F8EF7', '#4ADE80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.predictButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#0B0E14" />
            ) : (
              <>
                <MaterialCommunityIcons name={aiData ? "file-pdf-box" : "magic-staff"} size={24} color="#0B0E14" />
                <Text style={styles.predictButtonText}>
                  {aiData ? "Download PDF Report" : "Predict Heart Health"}
                </Text>
                <Feather name={aiData ? "download" : "bar-chart-2"} size={24} color="#0B0E14" style={styles.btnIconRight} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Neural Engine Card */}
        <View style={styles.neuralEngineCard}>
          <View style={styles.neuralIconBox}>
            <MaterialCommunityIcons name="brain" size={24} color="#A5B4FC" />
            <View style={[styles.neuralActiveDot, { backgroundColor: loading ? '#FBBF24' : '#4ADE80' }]} />
          </View>
          <View style={styles.neuralTextContent}>
            <Text style={styles.neuralTitle}>CardioGuard Neural Engine</Text>
            <Text style={styles.neuralSubtitle}>{loading ? "ANALYZING..." : "24/7 ACTIVE SCANNING"}</Text>
          </View>
          <View style={styles.certifiedBadge}>
            <Feather name="check-circle" size={12} color="#4ADE80" />
            <Text style={styles.certifiedText}>CERTIFIED</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
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

        {/* Glowing Active Center Button (Current Screen) */}
        <View style={styles.centerButtonWrapper}>
          <View style={styles.centerButtonGlow} />
          <TouchableOpacity 
            style={styles.centerButtonActive}
            onPress={() => navigation.navigate('AIPrediction')}
          >
            <MaterialCommunityIcons name="head-lightbulb-outline" size={28} color="#0B0E14" />
            <Text style={styles.centerButtonText}>Scan</Text>
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
          style={styles.navItem} 
          onPress={() => navigation.navigate('Profile')}
        >
          <Feather name="user" size={20} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0E14' },
  
  // Clean Header Styles
  headerContainerClean: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15 },
  headerLogoTextClean: { color: '#E0E7FF', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  headerDivider: { height: 1, backgroundColor: '#1F2937', width: '100%' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  
  terminalCard: { backgroundColor: '#151A23', borderRadius: 16, marginBottom: 20, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#1F2937' },
  terminalLeftBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#4ADE80' },
  terminalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  terminalHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  terminalHeaderText: { color: '#9CA3AF', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginLeft: 8 },
  terminalDots: { flexDirection: 'row' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4B5563', marginLeft: 4 },
  terminalBody: { paddingHorizontal: 16, paddingBottom: 16 },
  terminalLine: { flexDirection: 'row', alignItems: 'flex-start' },
  terminalCaret: { color: '#6B7280', fontSize: 13, fontFamily: 'monospace' },
  terminalLabel: { color: '#D1D5DB', fontSize: 13, fontFamily: 'monospace' },
  terminalValueGreen: { color: '#4ADE80', fontSize: 13, fontFamily: 'monospace', marginLeft: 14, marginTop: 2 },
  terminalNormal: { color: '#9CA3AF', fontSize: 13, fontFamily: 'monospace', lineHeight: 20 },
  marginTop8: { marginTop: 8 },

  aiGraphicContainer: { height: 320, width: '100%', borderRadius: 16, marginBottom: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  aiGraphicOverlay: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11, 14, 20, 0.4)', width: '100%', height: '100%', borderRadius: 16 },
  analysisCompleteText: { color: '#4ADE80', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  percentageText: { color: '#FFFFFF', fontSize: 64, fontWeight: '800', lineHeight: 70 },
  optimalText: { color: '#E0E7FF', fontSize: 14, textAlign: 'center', fontWeight: '500' },

  predictButtonWrapper: { shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10, marginBottom: 24 },
  predictButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 30 },
  predictButtonText: { color: '#0B0E14', fontSize: 18, fontWeight: '700', marginLeft: 12 },
  btnIconRight: { position: 'absolute', right: 24 },

  neuralEngineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151A23', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1F2937' },
  neuralIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative' },
  neuralActiveDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#151A23' },
  neuralTextContent: { flex: 1 },
  neuralTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  neuralSubtitle: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  certifiedBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  certifiedText: { color: '#4ADE80', fontSize: 10, fontWeight: '700', marginLeft: 4 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: '#111827', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#1F2937', zIndex: 1 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  
  centerButtonWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  centerButtonGlow: { position: 'absolute', top: -35, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(74, 222, 128, 0.2)', shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20, elevation: 15 },
  centerButtonActive: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4ADE80', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -30, zIndex: 100 },
  centerButtonText: { color: '#0B0E14', fontSize: 10, fontWeight: '700', marginTop: 2 },
});