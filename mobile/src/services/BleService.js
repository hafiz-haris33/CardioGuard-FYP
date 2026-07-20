/**
 * CardioGuard — React Native BLE Connection
 * ==========================================
 * Install: npm install react-native-ble-plx
 * iOS: add NSBluetoothAlwaysUsageDescription in Info.plist
 * Android: add BLUETOOTH permissions in AndroidManifest.xml
 */

import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

// ── Must match your ESP32 firmware exactly ──
const DEVICE_NAME       = 'CardioGuard';
const SERVICE_UUID      = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const manager = new BleManager();

export class CardioGuardBLE {
  device = null;
  subscription = null;
  onData = null;   // callback: (parsedJSON) => void

  // ── Start scanning and connect ──────────────────────────────
  async connect(onDataCallback) {
    this.onData = onDataCallback;

    return new Promise((resolve, reject) => {
      manager.startDeviceScan(null, null, async (error, scannedDevice) => {
        if (error) { reject(error); return; }

        if (scannedDevice?.name === DEVICE_NAME) {
          manager.stopDeviceScan();

          try {
            // Connect to device
            this.device = await scannedDevice.connect();
            console.log('[BLE] Connected to CardioGuard');

            // IMPORTANT: Request large MTU so JSON fits in one packet
            // Must match BLE_MTU in firmware (512)
            await this.device.requestMTU(512);
            console.log('[BLE] MTU negotiated');

            // Discover services and characteristics
            await this.device.discoverAllServicesAndCharacteristics();

            // Subscribe to notifications
            this.subscription = this.device.monitorCharacteristicForService(
              SERVICE_UUID,
              CHARACTERISTIC_UUID,
              (err, characteristic) => {
                if (err) {
                  console.error('[BLE] Notify error:', err);
                  return;
                }
                // Decode base64 → string → JSON
                const raw = Buffer.from(
                  characteristic.value, 'base64'
                ).toString('utf-8');

                try {
                  const data = JSON.parse(raw);
                  this.onData?.(data);
                } catch (e) {
                  console.warn('[BLE] JSON parse error:', e);
                }
              }
            );

            // Handle unexpected disconnect
            this.device.onDisconnected((err, dev) => {
              console.log('[BLE] Disconnected — retrying in 3s...');
              this.subscription?.remove();
              setTimeout(() => this.connect(this.onData), 3000);
            });

            resolve(this.device);
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  }

  // ── Disconnect cleanly ──────────────────────────────────────
  async disconnect() {
    this.subscription?.remove();
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
  }
}

// ── Usage Example ───────────────────────────────────────────────
/*
const ble = new CardioGuardBLE();

await ble.connect((data) => {
  // data is the parsed JSON from ESP32:
  // {
  //   ts: 12345,
  //   ecg:  { raw: 2048, leads_on: true },
  //   ppg:  { ir: 85000, finger: true, avg_bpm: 72.0, ... },
  //   imu:  { ax: 0.01, motion: false, ... }
  // }
  console.log('Heart Rate:', data.ppg.avg_bpm);
  console.log('ECG raw:', data.ecg.raw);
  console.log('Motion:', data.imu.motion);
});
*/
