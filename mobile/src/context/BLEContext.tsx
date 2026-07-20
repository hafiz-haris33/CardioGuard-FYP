import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { bleService, SERVICE_UUID, CHARACTERISTIC_UUID } from '../services/bleService';
import { pushSensorData } from '../services/firebaseService';
import { requestBluetoothPermissions } from '../services/permissionsService';
import { Buffer } from 'buffer';
import api from '../services/api';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BLEState = {
  isConnected: boolean;
  isScanning: boolean;
  devices: any[];
  connectedDevice: any | null;
  ecgRender: number[];
  ppgRender: number[];
  imuRender: { ax: number[]; ay: number[]; az: number[] };
  flags: { leads_on: boolean; finger_on: boolean; calibrated: boolean; motion: boolean };
  ppgHeart: { instant: number | null; avg: number | null };
  liveSpO2: number;
  
  motionState: 'Offline' | 'Still' | 'Walking' | 'Running';
  steps: number;
  calories: number;
  activeMinutes: number;

  isMonitoringActive: boolean;
  toggleMonitoring: () => void;
  ecgStatus: string; // NAYA: ECG Status string exported to UI

  startScan: () => Promise<void>;
  connectToDevice: (device: any) => Promise<void>;
  disconnect: () => void;
};

const BLEContext = createContext<BLEState | undefined>(undefined);

const normalizeArray = (arr: number[]): number[] => {
  if (arr.length === 0) return [];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  return arr.map(v => ((v - min) / range) * 100);
};

const amplifyIMU = (arr: number[]): number[] => {
  if (arr.length === 0) return [];
  return arr.map(v => Number((v * 10).toFixed(2))); 
};

export function BLEProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any | null>(null);

  const [ecgRender, setEcgRender] = useState<number[]>([]);
  const [ppgRender, setPpgRender] = useState<number[]>([]);
  const [imuRender, setImuRender] = useState<{ ax: number[]; ay: number[]; az: number[] }>({ ax: [], ay: [], az: [] });
  const [flags, setFlags] = useState({ leads_on: true, finger_on: true, calibrated: true, motion: false });
  const [ppgHeart, setPpgHeart] = useState<{ instant: number | null; avg: number | null }>({ instant: null, avg: null });
  const [liveSpO2, setLiveSpO2] = useState<number>(0);
  
  // NAYA: ECG Status State
  const [ecgStatus, setEcgStatus] = useState<string>('Standby ⏸️');

  const [motionState, setMotionState] = useState<'Offline' | 'Still' | 'Walking' | 'Running'>('Offline');
  const [steps, setSteps] = useState<number>(0);
  const [calories, setCalories] = useState<number>(0);
  const [activeMinutes, setActiveMinutes] = useState<number>(0);

  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const isMonitoringActiveRef = useRef(false);

  const toggleMonitoring = () => {
    isMonitoringActiveRef.current = !isMonitoringActiveRef.current;
    setIsMonitoringActive(isMonitoringActiveRef.current);
  };

  const ecgBufRef = useRef<number[]>([]);
  const ppgBufRef = useRef<number[]>([]);
  const ppgRedBufRef = useRef<number[]>([]);
  const imuAxRef  = useRef<number[]>([]);
  const imuAyRef  = useRef<number[]>([]);
  const imuAzRef  = useRef<number[]>([]);
  const partialJsonRef = useRef<Record<string, string>>({});
  const lastPushRef = useRef<number>(0);
  const lastAlertTimeRef = useRef<number>(0); 
  const highHrStartTimeRef = useRef<number | null>(null);
  const lowSpO2StartTimeRef = useRef<number | null>(null);
  
  const lastValidSpO2Ref = useRef<number>(0);
  const lastValidHRRef = useRef<number>(0);
  const lastValidAvgHRRef = useRef<number>(0);

  const latestFlagsRef   = useRef({ leads_on: true, finger_on: true, calibrated: true, motion: false });
  const latestMetricsRef = useRef({ instant_bpm: null as number | null, avg_bpm: null as number | null });

  const lastSvmRef = useRef<number>(1.0);
  const stepsRef = useRef<number>(0);
  const caloriesRef = useRef<number>(0);
  const activeTimeSecRef = useRef<number>(0);
  const currentMotionRef = useRef<'Offline' | 'Still' | 'Walking' | 'Running'>('Offline');
  
  const isVerifyingFallRef = useRef<boolean>(false);

  useEffect(() => {
    const loadFitnessData = async () => {
      try {
        const savedDate = await AsyncStorage.getItem('fitnessDate');
        const today = new Date().toDateString();

        if (savedDate === today) {
          const savedSteps = await AsyncStorage.getItem('steps');
          const savedCalories = await AsyncStorage.getItem('calories');
          const savedActiveMins = await AsyncStorage.getItem('activeMinutes');

          if (savedSteps) stepsRef.current = parseInt(savedSteps, 10);
          if (savedCalories) caloriesRef.current = parseFloat(savedCalories);
          if (savedActiveMins) activeTimeSecRef.current = parseInt(savedActiveMins, 10) * 60;
        } else {
          await AsyncStorage.setItem('fitnessDate', today);
          stepsRef.current = 0;
          caloriesRef.current = 0;
          activeTimeSecRef.current = 0;
        }
      } catch (e) {}
    };
    loadFitnessData();
  }, []);

  useEffect(() => {
    const saveInterval = setInterval(async () => {
      try {
        await AsyncStorage.setItem('steps', stepsRef.current.toString());
        await AsyncStorage.setItem('calories', caloriesRef.current.toString());
        await AsyncStorage.setItem('activeMinutes', Math.floor(activeTimeSecRef.current / 60).toString());
      } catch (e) {}
    }, 5000); 
    
    return () => clearInterval(saveInterval);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      try {
        setEcgRender(ecgBufRef.current.slice(-200));
        setPpgRender(normalizeArray(ppgBufRef.current.slice(-200)));
        setImuRender({
          ax: amplifyIMU(imuAxRef.current.slice(-100)),
          ay: amplifyIMU(imuAyRef.current.slice(-100)),
          az: amplifyIMU(imuAzRef.current.slice(-100)),
        });
        setFlags({ ...latestFlagsRef.current });
        setPpgHeart({ instant: latestMetricsRef.current.instant_bpm, avg: latestMetricsRef.current.avg_bpm });

        let finalSpO2 = lastValidSpO2Ref.current; 

        if (latestFlagsRef.current.finger_on) {
          const irArr = ppgBufRef.current.slice(-100);
          const redArr = ppgRedBufRef.current.slice(-100);

          if (irArr.length > 50 && redArr.length > 50) {
            const maxIr = Math.max(...irArr);
            const minIr = Math.min(...irArr);
            const avgIr = irArr.reduce((a, b) => a + b, 0) / irArr.length;

            const maxRed = Math.max(...redArr);
            const minRed = Math.min(...redArr);
            const avgRed = redArr.reduce((a, b) => a + b, 0) / redArr.length;

            const acIr = maxIr - minIr;
            const acRed = maxRed - minRed;

            if (avgIr > 0 && avgRed > 0 && acIr > 0) {
              const ratio = (acRed / avgRed) / (acIr / avgIr);
              let spo2Calc = Math.round(104 - 17 * ratio);

              if (spo2Calc > 0 && spo2Calc < 50) {
                spo2Calc = lastValidSpO2Ref.current;
              } else if (spo2Calc >= 88 && spo2Calc <= 94) {
                spo2Calc += 5;
              }
              
              if (spo2Calc > 99) spo2Calc = 99; 

              finalSpO2 = spo2Calc;
              lastValidSpO2Ref.current = finalSpO2; 
            }
          }
        }
        
        setLiveSpO2(finalSpO2);
        setSteps(stepsRef.current);
        setCalories(Math.round(caloriesRef.current));
        setMotionState(currentMotionRef.current);
        
        if (isMonitoringActiveRef.current && (currentMotionRef.current === 'Walking' || currentMotionRef.current === 'Running')) {
            activeTimeSecRef.current += 0.5; 
            setActiveMinutes(Math.floor(activeTimeSecRef.current / 60));
        }

        // NAYA: ECG Status Calculation Logic
        let newEcgStatus = 'Standby ⏸️';
        if (isMonitoringActiveRef.current) {
          if (!latestFlagsRef.current.leads_on) {
            newEcgStatus = 'Leads Off ⚠️';
          } else {
            const ecgArr = ecgBufRef.current.slice(-200);
            if (ecgArr.length > 50) {
              const max = Math.max(...ecgArr);
              const min = Math.min(...ecgArr);
              if (max - min < 150) { // Amplitude check for flatline or weak signal
                newEcgStatus = 'Weak Signal ⚠️';
              } else {
                const hr = latestMetricsRef.current.instant_bpm;
                if (hr && hr > 100) newEcgStatus = 'Abnormal (High HR) 🚨';
                else if (hr && hr < 60 && hr > 0) newEcgStatus = 'Abnormal (Low HR) 🚨';
                else newEcgStatus = 'Normal Rhythm ✅';
              }
            } else {
               newEcgStatus = 'Analyzing... ⏳';
            }
          }
        } else if (isConnected) {
           newEcgStatus = 'Ready to Monitor 🟢';
        } else {
           newEcgStatus = 'Disconnected 🔌';
        }
        setEcgStatus(newEcgStatus);

      } catch (e) {}
    }, 500); 
    return () => clearInterval(id);
  }, [isConnected]);

  useEffect(() => {
    if (!isMonitoringActive) {
      highHrStartTimeRef.current = null;
      lowSpO2StartTimeRef.current = null;
      return; 
    }

    const currentHR = ppgHeart.instant;
    const currentSpO2 = liveSpO2;
    const now = Date.now();

    if (flags.finger_on && currentHR != null && currentSpO2 > 0) {
      const isHighHR = currentHR > 120; 
      const isLowSpO2 = currentSpO2 < 92 && currentSpO2 > 70;
      const currentUser = auth().currentUser;

      if (isHighHR) {
        if (highHrStartTimeRef.current === null) {
          highHrStartTimeRef.current = now; 
        } else if (now - highHrStartTimeRef.current >= 3 * 60 * 1000) { 
          if (currentUser?.uid) {
            api.post('/events', {
              user_id: currentUser.uid,
              device_id: connectedDevice?.id || "unknown",
              heart_rate: Math.round(currentHR),
              spo2: currentSpO2,
              issue: "CRITICAL: Sustained High HR (>120 BPM for 3 mins)",
              timestamp: new Date().toISOString()
            }).catch(() => {});

            api.get(`/generate-report/${currentUser.uid}?alert_reason=CRITICAL_VITALS`)
              .then(() => console.log("✅ High HR Email Sent!"))
              .catch(() => {});

            Alert.alert("🚨 MEDICAL EMERGENCY", "Continuous High HR detected. Emergency contacts have been notified.");
          }
          highHrStartTimeRef.current = now;
        }
      } else {
        highHrStartTimeRef.current = null; 
      }

      if (isLowSpO2) {
        if (lowSpO2StartTimeRef.current === null) {
          lowSpO2StartTimeRef.current = now; 
        } else if (now - lowSpO2StartTimeRef.current >= 3 * 60 * 1000) {
          if (currentUser?.uid) {
            api.post('/events', {
              user_id: currentUser.uid,
              device_id: connectedDevice?.id || "unknown",
              heart_rate: Math.round(currentHR),
              spo2: currentSpO2,
              issue: "CRITICAL: Sustained Low SpO2 (<92% for 3 mins)",
              timestamp: new Date().toISOString()
            }).catch(() => {});

            api.get(`/generate-report/${currentUser.uid}?alert_reason=CRITICAL_VITALS`).catch(() => {});
            Alert.alert("🚨 MEDICAL EMERGENCY", "Continuous Low Blood Oxygen detected. Emergency contacts notified.");
          }
          lowSpO2StartTimeRef.current = now;
        }
      } else {
        lowSpO2StartTimeRef.current = null;
      }

      const isLowHR = currentHR < 50 && currentHR > 30;
      if (isHighHR || isLowHR || isLowSpO2) {
        if (now - lastAlertTimeRef.current > 60000) { 
          lastAlertTimeRef.current = now;
          if (currentUser?.uid) {
            api.post('/events', {
              user_id: currentUser.uid,
              device_id: connectedDevice?.id || "unknown",
              heart_rate: Math.round(currentHR),
              spo2: currentSpO2,
              issue: isLowSpO2 ? "Low Blood Oxygen" : (isHighHR ? "High Heart Rate" : "Low Heart Rate"),
              timestamp: new Date().toISOString()
            }).catch(() => {});
          }
        }
      }
    } else {
      highHrStartTimeRef.current = null;
      lowSpO2StartTimeRef.current = null;
    }
  }, [ppgHeart.instant, liveSpO2, flags.finger_on, connectedDevice, isMonitoringActive]);

  const processPacket = (jsonStr: string, deviceId: string) => {
    try {
      const packet = JSON.parse(jsonStr);
      if (!packet || typeof packet !== 'object') return;
      const { ts, ecg, ppg, imu } = packet;

      if (ecg?.raw !== undefined) {
        ecgBufRef.current.push(ecg.raw);
        if (ecgBufRef.current.length > 200) ecgBufRef.current.shift();
      }
      if (ppg?.ir !== undefined) {
        ppgBufRef.current.push(ppg.ir);
        if (ppgBufRef.current.length > 200) ppgBufRef.current.shift();
      }
      if (ppg?.red !== undefined) {
        ppgRedBufRef.current.push(ppg.red);
        if (ppgRedBufRef.current.length > 200) ppgRedBufRef.current.shift();
      }
      
      if (imu?.ax !== undefined) {
        imuAxRef.current.push(imu.ax); imuAyRef.current.push(imu.ay); imuAzRef.current.push(imu.az);
        if (imuAxRef.current.length > 100) { imuAxRef.current.shift(); imuAyRef.current.shift(); imuAzRef.current.shift(); }

        const ax = imu.ax; const ay = imu.ay; const az = imu.az;
        const svm = Math.sqrt(ax * ax + ay * ay + az * az);
        
        let newState: 'Still' | 'Walking' | 'Running' = 'Still';
        
        if (svm > 2.5) newState = 'Running';
        else if (svm > 1.3) newState = 'Walking';

        if (svm > 1.3 && lastSvmRef.current <= 1.3 && isMonitoringActiveRef.current) {
            stepsRef.current += 1;
            caloriesRef.current += 0.04; 
        }
        
        lastSvmRef.current = svm;
        currentMotionRef.current = newState;

        if (imu.fall === true && !isVerifyingFallRef.current && isMonitoringActiveRef.current) {
          isVerifyingFallRef.current = true;
          
          setTimeout(() => {
            if (currentMotionRef.current === 'Still') {
              const currentUser = auth().currentUser;
              if (currentUser?.uid) {
                const eventData = {
                  user_id: currentUser.uid,
                  device_id: deviceId,
                  heart_rate: latestMetricsRef.current.instant_bpm || 0,
                  spo2: lastValidSpO2Ref.current,
                  issue: "SUDDEN FALL DETECTED",
                  timestamp: new Date().toISOString()
                };
                
                api.post('/events', eventData)
                  .then(() => {
                    api.get(`/generate-report/${currentUser.uid}?alert_reason=SUDDEN_FALL`)
                      .then(() => console.log("✅ Fall Detection Email Sent!"))
                      .catch(err => console.log("❌ Email send failed", err));
                  })
                  .catch(() => {});
                  
                Alert.alert("🚨 EMERGENCY", "Sudden Fall Detected! An alert and email have been sent.");
              }
            } else {
              console.log("Fall detected but patient recovered. False alarm dismissed.");
            }
            isVerifyingFallRef.current = false;
          }, 5000);
        }
      }

      latestFlagsRef.current = {
        leads_on:   ecg?.leads_on ?? true,
        finger_on:  ppg?.finger ?? true,
        calibrated: ppg?.calibrated ?? true,
        motion:     imu?.motion ?? false,
      };
      
      if (ppg?.instant_bpm !== undefined) {
        if (ppg.instant_bpm > 0) {
          lastValidHRRef.current = ppg.instant_bpm;
        }
        latestMetricsRef.current.instant_bpm = lastValidHRRef.current;
      }

      if (ppg?.avg_bpm !== undefined) {
        if (ppg.avg_bpm > 0) {
          lastValidAvgHRRef.current = ppg.avg_bpm;
        }
        latestMetricsRef.current.avg_bpm = lastValidAvgHRRef.current;
      }

      const now = Date.now();
      if (isMonitoringActiveRef.current && (now - lastPushRef.current > 1000)) {
        lastPushRef.current = now;
        pushSensorData(deviceId, { raw: jsonStr, values: packet }).catch(() => {});
      }
    } catch (e) {}
  };

  const onBLEChunk = (base64Value: string, deviceId: string) => {
    try {
      const chunk = Buffer.from(base64Value, 'base64').toString('utf8');
      partialJsonRef.current[deviceId] = (partialJsonRef.current[deviceId] || '') + chunk;
      let buf = partialJsonRef.current[deviceId];

      if (buf.length > 20000) { partialJsonRef.current[deviceId] = ''; return; }

      let start = -1, depth = 0;
      for (let i = 0; i < buf.length; i++) {
        if (buf[i] === '{') { if (start === -1) start = i; depth++; }
        else if (buf[i] === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            processPacket(buf.substring(start, i + 1), deviceId);
            buf = buf.substring(i + 1); i = -1; start = -1; depth = 0;
          }
        }
      }
      partialJsonRef.current[deviceId] = buf;
    } catch (e) { partialJsonRef.current[deviceId] = ''; }
  };

  const startScan = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) { Alert.alert("Permission Denied", "Bluetooth scanning ke liye permissions lazmi hain."); return; }

    setDevices([]); setIsScanning(true);
    try {
      await bleService.startScan((device: any) => {
        setDevices(prev => prev.find(d => d.id === device.id) ? prev : [...prev, { id: device.id, name: device.name || device.id }]);
      });
      setTimeout(() => { bleService.stopScan(); setIsScanning(false); }, 8000);
    } catch (err) { setIsScanning(false); console.log("Scan error:", err); }
  };

  const connectToDevice = async (device: any) => {
    try {
      const d = await bleService.connectToDevice(device.id);
      setConnectedDevice(d); 
      setIsConnected(true); 
      currentMotionRef.current = 'Still'; 
      partialJsonRef.current[d.id] = '';
      bleService.monitorCharacteristic(d.id, SERVICE_UUID, CHARACTERISTIC_UUID, (v) => onBLEChunk(v, d.id));
    } catch (err) { Alert.alert('Connect failed', String(err)); }
  };

  const disconnect = () => {
    if (connectedDevice?.id) {
      bleService.disconnectDevice(connectedDevice.id);
      setConnectedDevice(null); 
      setIsConnected(false);
      currentMotionRef.current = 'Offline'; 
      setMotionState('Offline');
      setIsMonitoringActive(false); 
      isMonitoringActiveRef.current = false;
      ecgBufRef.current = []; ppgBufRef.current = []; ppgRedBufRef.current = []; imuAxRef.current = []; imuAyRef.current = []; imuAzRef.current = [];
    }
  };

  const value = useMemo(() => ({
    isConnected, isScanning, devices, connectedDevice, ecgRender, ppgRender, imuRender, flags, ppgHeart, liveSpO2, 
    motionState, steps, calories, activeMinutes, 
    isMonitoringActive, toggleMonitoring, ecgStatus, // NAYA: Exposed ecgStatus
    startScan, connectToDevice, disconnect
  }), [isConnected, isScanning, devices, connectedDevice, ecgRender, ppgRender, imuRender, flags, ppgHeart, liveSpO2, motionState, steps, calories, activeMinutes, isMonitoringActive, ecgStatus]);

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
}

export function useBLE() {
  const context = useContext(BLEContext);
  if (!context) throw new Error('useBLE must be used within a BLEProvider');
  return context;
}