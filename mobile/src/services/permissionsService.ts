import { Platform, Alert } from 'react-native';
import { checkMultiple, requestMultiple, openSettings, PERMISSIONS, RESULTS } from 'react-native-permissions';

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const apiLevel = Platform.Version as number;
    let perms: string[] = [];

    if (apiLevel >= 31) {
      // Android 12+
      perms = [
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      ];
    } else {
      // Older Android: location required for BLE scanning
      perms = [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION];
    }

    // Check existing statuses
    const statuses = await checkMultiple(perms as any);
    const missing = perms.filter(p => statuses[p] !== RESULTS.GRANTED);

    if (missing.length === 0) return true;

    const req = await requestMultiple(missing as any);
    const ok = Object.values(req).every(v => v === RESULTS.GRANTED);
    if (!ok) {
      Alert.alert(
        'Permissions required',
        'Bluetooth permissions are required. Please allow them in app settings.',
        [
          { text: 'Open Settings', onPress: () => openSettings() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
    return ok;
  } catch (e) {
    console.warn('requestBluetoothPermissions error', e);
    return false;
  }
}