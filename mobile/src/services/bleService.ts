import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Platform } from 'react-native'; // <-- YEH LAZMI ADD KARO

export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

class BLEService {
  manager: BleManager;
  monitorSubscription: Subscription | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  startScan(onDeviceFound: (device: Device) => void) {
    return new Promise<void>((resolve, reject) => {
      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) { reject(error); return; }
        if (device && device.id) { onDeviceFound(device); }
      });
      resolve();
    });
  }

  stopScan() {
    try { this.manager.stopDeviceScan(); } catch (e) {}
  }

  async connectToDevice(deviceId: string) {
    const device = await this.manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    // ── DATA CUT HONE SE BACHANE KE LIYE YEH LINES ZAROORI HAIN ──
    if (Platform.OS === 'android') {
      try {
        await device.requestMTU(512);
        console.log('MTU Size increased to 512');
      } catch (e) {
        console.warn('MTU request failed', e);
      }
    }

    return device;
  }

  monitorCharacteristic(deviceId: string, serviceUUID: string, charUUID: string, onData: (base64Value: string) => void) {
    this.monitorSubscription = this.manager.monitorCharacteristicForDevice(
      deviceId, serviceUUID, charUUID,
      (error, characteristic) => {
        if (error) return;
        if (characteristic?.value) { onData(characteristic.value); }
      }
    );
    return this.monitorSubscription;
  }

  disconnectDevice(deviceId: string) {
    try {
      this.monitorSubscription && this.monitorSubscription.remove();
      this.manager.cancelDeviceConnection(deviceId);
    } catch (e) {}
  }
}

export const bleService = new BLEService();
export default bleService;