import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth'; // Firebase import kiya UID ke liye
import api from '../services/api'; // Axios instance import kiya

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 24;

const AGE_ITEM_WIDTH = 80;
const WEIGHT_ITEM_WIDTH = 20;

export default function ProfileSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Pichli screens se aane wala data catch karna
  const signupData = {
    deviceId: route.params?.deviceId || '',
    fullName: route.params?.fullName || '',
    email: route.params?.email || '',
    emergencyContact: route.params?.emergencyContact || '',
  };
  
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<'Male' | 'Female' | null>('Male');
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(74);
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LBS'>('KG');
  const [height, setHeight] = useState(178);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['Diabetes']);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  // --- Asal FastAPI Core Linking Function ---
  const handleCompleteSetup = async () => {
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      Alert.alert('Session Error', 'User session not found. Please log in again.');
      return;
    }

    setIsLoading(true);

    // Medical conditions array ko string me convert karna (e.g. "Diabetes, Hypertension")
    const conditionsString = selectedConditions.join(', ');

    // Weight ko standard KG me convert karna agar LBS select kiya ho
    const finalWeight = weightUnit === 'LBS' ? Math.round(weight * 0.453592) : weight;

    const payload = {
      uid: currentUser.uid, // Firebase se aane wali asli UID
      email: signupData.email,
      full_name: signupData.fullName,
      emergency_contact: signupData.emergencyContact,
      gender: gender,
      age: age,
      weight: finalWeight,
      height: height,
      medical_conditions: conditionsString,
      device_id: signupData.deviceId, // Verify ki hui device ID
    };

    try {
      // Backend ke /register-user endpoint par POST request bhejna
      const response = await api.post('/register-user', payload);

      if (response.data.status === 'success') {
        Alert.alert('Setup Complete', 'Your device and profile are securely synchronized!');
        navigation.navigate('Dashboard');
      }
    } catch (error: any) {
      if (error.response) {
        Alert.alert('Registration Error', error.response.data.detail || 'Failed to save profile.');
      } else {
        Alert.alert('Network Error', 'Cannot connect to the backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCondition = (condition: string) => {
    if (condition === 'None / Healthy') {
      setSelectedConditions(['None / Healthy']);
      return;
    }
    
    let newConditions = selectedConditions.filter(c => c !== 'None / Healthy');
    if (newConditions.includes(condition)) {
      newConditions = newConditions.filter(c => c !== condition);
    } else {
      newConditions.push(condition);
    }
    setSelectedConditions(newConditions);
  };

  const handleAgeScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / AGE_ITEM_WIDTH);
    const calculatedAge = 18 + index;
    if (calculatedAge >= 18 && calculatedAge <= 100 && calculatedAge !== age) {
      setAge(calculatedAge);
    }
  };

  const handleWeightScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / WEIGHT_ITEM_WIDTH);
    const calculatedWeight = 30 + index;
    if (calculatedWeight >= 30 && calculatedWeight <= 200 && calculatedWeight !== weight) {
      setWeight(calculatedWeight);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.mainTitle}>Let's personalize your{'\n'}baseline.</Text>
      <Text style={styles.subtitleText}>
        This helps our AI precisely analyze your ECG and heart metrics.
      </Text>

      <Text style={styles.sectionLabel}>BIOLOGICAL SEX</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.genderCard, gender === 'Male' ? styles.activeCard : null]}
          onPress={() => setGender('Male')}
        >
          <MaterialCommunityIcons 
            name="gender-male" 
            size={36} 
            color={gender === 'Male' ? '#A5B4FC' : '#6B7280'} 
            style={styles.genderIcon}
          />
          <Text style={[styles.genderText, gender === 'Male' ? styles.activeText : null]}>Male</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.genderCard, gender === 'Female' ? styles.activeCard : null]}
          onPress={() => setGender('Female')}
        >
          <MaterialCommunityIcons 
            name="gender-female" 
            size={36} 
            color={gender === 'Female' ? '#A5B4FC' : '#6B7280'} 
            style={styles.genderIcon}
          />
          <Text style={[styles.genderText, gender === 'Female' ? styles.activeText : null]}>Female</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, styles.marginTop40]}>AGE</Text>
      
      <View style={styles.ageScrollerWrapper}>
        <View style={styles.fixedAgeIndicator} pointerEvents="none">
          <View style={styles.activeAgeUnderline} />
          <View style={styles.ageTicksRow}>
            <View style={styles.tickSmall} />
            <View style={styles.tickMedium} />
            <View style={styles.tickLarge} />
            <View style={styles.tickMedium} />
            <View style={styles.tickSmall} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={AGE_ITEM_WIDTH}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleAgeScroll}
          contentContainerStyle={{
            paddingHorizontal: (width - (CONTAINER_PADDING * 2) - AGE_ITEM_WIDTH) / 2
          }}
        >
          {Array.from({ length: 83 }, (_, i) => i + 18).map((a) => {
            const isActive = age === a;
            return (
              <View key={a} style={styles.ageItemContainer}>
                <Text style={isActive ? styles.activeAgeText : styles.dimAgeText}>{a}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.spacer} />
      <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
        <Text style={styles.primaryButtonText}>Next</Text>
        <Feather name="arrow-right" size={20} color="#1E3A8A" style={styles.btnIconRight} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.mainTitle}>Physical Vitals.</Text>
      <Text style={styles.subtitleText}>
        Body metrics are crucial for accurate SpO2 and metabolic tracking.
      </Text>

      <View style={styles.vitalsCard}>
        <View style={styles.vitalsHeader}>
          <Text style={styles.sectionLabel}>WEIGHT</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity 
              style={[styles.unitBtn, weightUnit === 'KG' ? styles.unitBtnActive : null]}
              onPress={() => setWeightUnit('KG')}
            >
              <Text style={[styles.unitText, weightUnit === 'KG' ? styles.unitTextActive : null]}>KG</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.unitBtn, weightUnit === 'LBS' ? styles.unitBtnActive : null]}
              onPress={() => setWeightUnit('LBS')}
            >
              <Text style={[styles.unitText, weightUnit === 'LBS' ? styles.unitTextActive : null]}>LBS</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.measurementDisplay}>
          <Text style={styles.measurementNumber}>{weight}</Text>
          <Text style={styles.measurementUnit}>{weightUnit.toLowerCase()}</Text>
        </View>
        
        <View style={styles.weightScrollerWrapper}>
          <View style={styles.weightCenterIndicator} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={WEIGHT_ITEM_WIDTH}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={handleWeightScroll}
            contentContainerStyle={{
              paddingHorizontal: (width - (CONTAINER_PADDING * 2) - WEIGHT_ITEM_WIDTH) / 2
            }}
          >
            {Array.from({ length: 171 }, (_, i) => i + 30).map((w) => {
              const isMajor = w % 5 === 0;
              return (
                <View key={w} style={styles.weightItemContainer}>
                  {isMajor ? <Text style={styles.rulerMiniNumber}>{w}</Text> : <View style={styles.rulerNumberSpacer} />}
                  <View style={[styles.rulerLineTick, isMajor ? styles.rulerLineTickMajor : null]} />
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={styles.vitalsCard}>
        <Text style={[styles.sectionLabel, styles.marginBottom20]}>HEIGHT</Text>
        <View style={styles.heightControlRow}>
          <TouchableOpacity style={styles.circleBtnDark} onPress={() => setHeight(h => h - 1)}>
            <Feather name="minus" size={24} color="#D1D5DB" />
          </TouchableOpacity>
          
          <View style={styles.measurementDisplayRow}>
            <Text style={styles.measurementNumber}>{height}</Text>
            <Text style={styles.measurementUnit}>cm</Text>
          </View>
          
          <TouchableOpacity style={styles.circleBtnPrimary} onPress={() => setHeight(h => h + 1)}>
            <Feather name="plus" size={24} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information" size={24} color="#4ADE80" style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Precise metrics ensure <Text style={styles.greenText}>99.2% accuracy</Text> in basal metabolic rate calculations.
        </Text>
      </View>

      <View style={styles.spacer} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
          <Feather name="arrow-left" size={20} color="#F9FAFB" style={styles.btnIconLeft} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, styles.flexOne, styles.marginLeft16]} onPress={() => setStep(3)}>
          <Text style={styles.primaryButtonText}>Next</Text>
          <Feather name="arrow-right" size={20} color="#1E3A8A" style={styles.btnIconRight} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => {
    const conditionsList = ['Hypertension', 'Diabetes', 'Arrhythmia', 'Asthma', 'High Cholesterol', 'None / Healthy'];
    
    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.mainTitle, styles.textCenter]}>Medical History</Text>
        <Text style={[styles.subtitleText, styles.textCenter, styles.marginBottom30]}>
          Select any pre-existing conditions to calibrate the CardioGuard AI prediction engine.
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {conditionsList.map((item, index) => {
            const isSelected = selectedConditions.includes(item);
            const isHealthy = item === 'None / Healthy';
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.conditionItem,
                  isSelected && !isHealthy ? styles.conditionItemActive : null,
                  isHealthy ? styles.conditionItemHealthy : null,
                  isSelected && isHealthy ? styles.conditionItemHealthyActive : null
                ]}
                onPress={() => toggleCondition(item)}
              >
                <Text style={[styles.conditionText, isHealthy ? styles.greenText : null]}>{item}</Text>
                {isSelected ? (
                  <MaterialCommunityIcons name="check-circle" size={22} color={isHealthy ? '#4ADE80' : '#A5B4FC'} />
                ) : (
                  <View style={[styles.emptyCircle, isHealthy ? styles.emptyCircleHealthy : null]} />
                )}
              </TouchableOpacity>
            );
          })}

          <View style={[styles.infoCard, styles.marginTop20, styles.alignStart]}>
            <View style={styles.iconBoxDark}>
              <MaterialCommunityIcons name="robot-outline" size={20} color="#A5B4FC" />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoTitle}>AI Calibration Active</Text>
              <Text style={styles.infoTextSmall}>
                Your data is processed locally using secure on-device neural engines. This history helps our models identify subtle variations in your heart rhythm relative to your clinical profile.
              </Text>
            </View>
          </View>

          {/* Update button to trigger handleCompleteSetup with loading spinner */}
          <TouchableOpacity 
            style={[styles.primaryButton, styles.marginTop30]} 
            onPress={handleCompleteSetup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1E3A8A" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Complete Setup & Enter Dashboard</Text>
                <Feather name="arrow-right" size={20} color="#1E3A8A" style={styles.btnIconRight} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBackBtn} onPress={() => setStep(2)}>
            <Feather name="arrow-left" size={16} color="#9CA3AF" />
            <Text style={styles.bottomBackText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0E14" />
      
      <View style={styles.header}>
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, step >= 1 ? styles.activeDot : null]} />
          <View style={[styles.dot, step >= 2 ? styles.activeDot : null]} />
          <View style={[styles.dot, step === 3 ? styles.activeDot : null]} />
        </View>
      </View>

      {step === 1 ? renderStep1() : null}
      {step === 2 ? renderStep2() : null}
      {step === 3 ? renderStep3() : null}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E14' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  dotsContainer: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#374151', marginRight: 8 },
  activeDot: { backgroundColor: '#A5B4FC' },
  stepContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#F9FAFB', marginBottom: 12, lineHeight: 40 },
  subtitleText: { fontSize: 15, color: '#9CA3AF', lineHeight: 24, marginBottom: 30 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  spacer: { flex: 1 },
  genderCard: { flex: 1, height: 160, backgroundColor: '#15171C', borderRadius: 16, borderWidth: 1, borderColor: '#1F2937', justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
  activeCard: { borderColor: '#A5B4FC', backgroundColor: '#1E293B', shadowColor: '#A5B4FC', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  genderIcon: { marginBottom: 16 },
  genderText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  activeText: { color: '#A5B4FC' },
  marginTop40: { marginTop: 40 },
  ageScrollerWrapper: { height: 120, marginVertical: 10, position: 'relative', justifyContent: 'flex-start' },
  fixedAgeIndicator: { position: 'absolute', top: 55, alignSelf: 'center', alignItems: 'center', zIndex: 10 },
  ageItemContainer: { width: AGE_ITEM_WIDTH, alignItems: 'center', justifyContent: 'center', height: 60 },
  dimAgeText: { fontSize: 26, color: '#1F2937', fontWeight: '700' },
  activeAgeText: { fontSize: 44, fontWeight: '800', color: '#E0E7FF' },
  activeAgeUnderline: { width: 50, height: 4, backgroundColor: '#A5B4FC', borderRadius: 2, shadowColor: '#A5B4FC', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, marginBottom: 14 },
  ageTicksRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  tickSmall: { width: 2, height: 6, backgroundColor: '#374151', marginHorizontal: 4, borderRadius: 1 },
  tickMedium: { width: 2, height: 10, backgroundColor: '#4B5563', marginHorizontal: 4, borderRadius: 1 },
  tickLarge: { width: 2, height: 18, backgroundColor: '#A5B4FC', marginHorizontal: 4, borderRadius: 1 },
  vitalsCard: { backgroundColor: '#15171C', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1F2937', marginBottom: 20 },
  vitalsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  unitToggle: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 20, padding: 4 },
  unitBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16 },
  unitBtnActive: { backgroundColor: '#A5B4FC' },
  unitText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  unitTextActive: { color: '#1E3A8A' },
  measurementDisplay: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 20 },
  measurementDisplayRow: { flexDirection: 'row', alignItems: 'baseline', marginHorizontal: 30 },
  measurementNumber: { fontSize: 54, fontWeight: '800', color: '#F9FAFB' },
  measurementUnit: { fontSize: 16, color: '#9CA3AF', marginLeft: 6, fontWeight: '600' },
  weightScrollerWrapper: { height: 70, marginTop: 10, position: 'relative', justifyContent: 'center' },
  weightCenterIndicator: { position: 'absolute', width: 2, height: 40, backgroundColor: '#4F8EF7', bottom: 0, alignSelf: 'center', zIndex: 10, shadowColor: '#4F8EF7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8 },
  weightItemContainer: { width: WEIGHT_ITEM_WIDTH, alignItems: 'center', justifyContent: 'flex-end', height: 60 },
  rulerMiniNumber: { fontSize: 11, color: '#4B5563', fontWeight: '600', marginBottom: 6 },
  rulerNumberSpacer: { height: 16 },
  rulerLineTick: { width: 1, height: 12, backgroundColor: '#374151' },
  rulerLineTickMajor: { height: 22, backgroundColor: '#6B7280', width: 1.5 },
  marginBottom20: { marginBottom: 20 },
  heightControlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  circleBtnDark: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  circleBtnPrimary: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F8EF7', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F8EF7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#15171C', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1F2937' },
  infoIcon: { marginRight: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#D1D5DB', lineHeight: 20 },
  greenText: { color: '#4ADE80' },
  btnIconLeft: { marginRight: 8 },
  flexOne: { flex: 1 },
  marginLeft16: { marginLeft: 16 },
  textCenter: { textAlign: 'center' },
  marginBottom30: { marginBottom: 30 },
  conditionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 56, paddingHorizontal: 20, backgroundColor: '#15171C', borderRadius: 28, borderWidth: 1, borderColor: '#1F2937', marginBottom: 12 },
  conditionItemActive: { backgroundColor: '#1E293B', borderColor: '#3B82F6' },
  conditionItemHealthy: { borderColor: '#064E3B' },
  conditionItemHealthyActive: { backgroundColor: '#064E3B', borderColor: '#10B981' },
  conditionText: { fontSize: 15, color: '#D1D5DB', fontWeight: '500' },
  emptyCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#374151' },
  emptyCircleHealthy: { borderColor: '#166534' },
  marginTop20: { marginTop: 20 },
  alignStart: { alignItems: 'flex-start' },
  iconBoxDark: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  infoTextWrapper: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#A5B4FC', marginBottom: 4 },
  infoTextSmall: { fontSize: 11, color: '#9CA3AF', lineHeight: 18 },
  marginTop30: { marginTop: 30 },
  bottomBackBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 40 },
  bottomBackText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  primaryButton: { backgroundColor: '#A5B4FC', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  secondaryButton: { backgroundColor: '#15171C', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#374151', paddingHorizontal: 30 },
  primaryButtonText: { color: '#1E3A8A', fontSize: 16, fontWeight: '700' },
  secondaryButtonText: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  btnIconRight: { marginLeft: 8 },
});