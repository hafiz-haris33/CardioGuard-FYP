import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBLE } from '../context/BLEContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

type ConnectionState = 'INITIAL' | 'SCANNING' | 'SUCCESS' | 'DEVICE_STATUS';
type RootStackParamList = { Dashboard: undefined; Bluetooth: undefined; };

export default function BluetoothScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Bluetooth'>>();
  const { isConnected, isScanning, devices, startScan, connectToDevice, disconnect, connectedDevice } = useBLE();
  
  const [currentState, setCurrentState] = useState<ConnectionState>(isConnected ? 'DEVICE_STATUS' : 'INITIAL');

  useEffect(() => {
    if (isConnected && currentState !== 'SUCCESS') setCurrentState('DEVICE_STATUS');
    else if (!isConnected && currentState === 'DEVICE_STATUS') setCurrentState('INITIAL');
  }, [isConnected]);

  const handleScan = () => {
    setCurrentState('SCANNING');
    startScan();
  };

  const handleConnect = async (device: any) => {
    await connectToDevice(device);
  };

  const renderInitialState = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.mainTitle}>Bluetooth Sync</Text>
      <View style={styles.largeIconContainer}><View style={styles.iconRing}><MaterialCommunityIcons name="bluetooth" size={40} color="#A5B4FC" /></View></View>
      <Text style={styles.descriptionText}>Connect your sensor for live{'\n'}<Text style={styles.highlightText}>ECG tracking.</Text></Text>
      <TouchableOpacity style={styles.primaryButton} onPress={handleScan}>
        <MaterialCommunityIcons name="radar" size={20} color="#1E3A8A" style={styles.btnIcon} />
        <Text style={styles.primaryButtonText}>START SCANNING</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScanningState = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.mainTitle}>Searching...</Text>
      <View style={[styles.largeIconContainer, { marginVertical: 20 }]}><View style={styles.iconRing}><MaterialCommunityIcons name="bluetooth-audio" size={40} color="#A5B4FC" /></View></View>
      
      {devices.length > 0 ? (
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          style={{ width: '100%', maxHeight: 200 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.deviceFoundCard} onPress={() => handleConnect(item)}>
              <View style={styles.deviceIconBox}><MaterialCommunityIcons name="waveform" size={24} color="#A5B4FC" /></View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.tapToConnect}>Tap to connect</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.scanningIndicatorBtn}>
          {isScanning ? <ActivityIndicator size="small" color="#6B7280" /> : <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#6B7280" />}
          <Text style={styles.scanningBtnText}>{isScanning ? 'Scanning...' : 'No devices found'}</Text>
        </View>
      )}
      
      {!isScanning && (
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 20 }]} onPress={handleScan}>
          <Text style={styles.primaryButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDeviceStatusState = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.mainTitle}>Device Status</Text>
      <View style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
           <View style={styles.smallBluetoothIcon}><MaterialCommunityIcons name="bluetooth" size={20} color="#A5B4FC" /></View>
           <View style={styles.statusCardInfo}>
              <Text style={styles.statusDeviceName}>{connectedDevice?.name || 'CardioGuard Sensor'}</Text>
              <View style={styles.connectionStatusRow}><View style={styles.greenDot} /><Text style={styles.connectedText}>Connected</Text></View>
           </View>
        </View>
      </View>
      <TouchableOpacity style={styles.dangerButton} onPress={() => { disconnect(); setCurrentState('INITIAL'); }}>
        <MaterialCommunityIcons name="link-off" size={20} color="#F87171" style={styles.btnIcon} />
        <Text style={styles.dangerButtonText}>Disconnect Device</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.overlayBackground}>
        <View style={styles.bottomSheet}>
          <View style={styles.dragHandle} />
          {currentState === 'INITIAL' && renderInitialState()}
          {currentState === 'SCANNING' && renderScanningState()}
          {currentState === 'DEVICE_STATUS' && renderDeviceStatusState()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  overlayBackground: { flex: 1, justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#1C1F26', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, minHeight: '65%' },
  dragHandle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  contentContainer: { flex: 1, alignItems: 'center' },
  mainTitle: { fontSize: 22, fontWeight: '700', color: '#F9FAFB', marginBottom: 8, textAlign: 'center' },
  descriptionText: { fontSize: 16, color: '#D1D5DB', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  highlightText: { color: '#A5B4FC', fontWeight: '600' },
  largeIconContainer: { marginVertical: 40, justifyContent: 'center', alignItems: 'center' },
  iconRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#374151', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(55, 65, 81, 0.2)' },
  primaryButton: { backgroundColor: '#BFDBFE', width: '100%', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#1E3A8A', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  btnIcon: { marginRight: 8 },
  dangerButton: { backgroundColor: '#7F1D1D', width: '100%', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#991B1B' },
  dangerButtonText: { color: '#FECACA', fontSize: 15, fontWeight: '600' },
  deviceFoundCard: { width: '100%', backgroundColor: '#15171C', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#374151', marginBottom: 12 },
  deviceIconBox: { width: 48, height: 48, backgroundColor: '#262A36', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '600', color: '#F9FAFB', marginBottom: 2 },
  tapToConnect: { fontSize: 12, color: '#A5B4FC' },
  scanningIndicatorBtn: { width: '100%', backgroundColor: '#1F232B', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  scanningBtnText: { color: '#6B7280', fontSize: 14, marginLeft: 8 },
  statusCard: { width: '100%', backgroundColor: 'rgba(52, 211, 153, 0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.2)', marginBottom: 30 },
  statusCardHeader: { flexDirection: 'row', alignItems: 'center' },
  smallBluetoothIcon: { width: 40, height: 40, backgroundColor: '#262A36', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statusCardInfo: { flex: 1 },
  statusDeviceName: { fontSize: 15, fontWeight: '600', color: '#F9FAFB', marginBottom: 4 },
  connectionStatusRow: { flexDirection: 'row', alignItems: 'center' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399', marginRight: 6 },
  connectedText: { fontSize: 12, color: '#34D399' },
});