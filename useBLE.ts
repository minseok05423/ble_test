import { useEffect, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  allDevices: Device[];
  connectToDevice: (device: Device) => Promise<void>;
  connectedDevice: Device | null;
  disconnectFromDevice: () => void;
  readData: (device: Device) => Promise<void>;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [decodedData, setDecodedData] = useState<string[]>([]);

  const requestPermissions = async () => {
    if (Platform.OS === "ios") {
      return true;
    }
    if (
      Platform.OS === "android" &&
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ) {
      const apiLevel = parseInt(Platform.Version.toString(), 10);

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      if (
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }

    console.log("Permission have not been granted");

    return false;
  };

  useEffect(() => {
    const subscription = bleManager.onStateChange((state) => {
      if (state === "PoweredOn") {
        scanForPeripherals();
        subscription.remove();
      }
    }, true);
    return () => subscription.remove();
  }, [bleManager]);

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Scan error:", error);
        return;
      }
      if (device && device.name?.toLowerCase().trim().includes("esp32")) {
        console.log("Found device:", device.name || "Unknown", device.id);
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      readData(deviceConnection);
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  const decodeBatchIMUData = (base64Value: string) => {
    const rawData = atob(base64Value);
    const bytes = new Uint8Array(rawData.split("").map((c) => c.charCodeAt(0)));

    const expectedSize = 220; // 5 readings * 44 bytes each
    if (bytes.length !== expectedSize) {
      console.log(`⚠️ Expected ${expectedSize} bytes, got ${bytes.length}`);
      return null;
    }

    const view = new DataView(bytes.buffer);
    const readings = [];

    // Decode 5 readings
    for (let i = 0; i < 5; i++) {
      const offset = i * 44;

      readings.push({
        timestamp: view.getUint32(offset + 0, true),
        accel: {
          x: view.getFloat32(offset + 4, true),
          y: view.getFloat32(offset + 8, true),
          z: view.getFloat32(offset + 12, true),
        },
        gyro: {
          x: view.getFloat32(offset + 16, true),
          y: view.getFloat32(offset + 20, true),
          z: view.getFloat32(offset + 24, true),
        },
        mag: {
          x: view.getFloat32(offset + 28, true),
          y: view.getFloat32(offset + 32, true),
          z: view.getFloat32(offset + 36, true),
        },
        temperature: view.getFloat32(offset + 40, true),
      });
    }

    return readings;
  };

  const readData = async (device: Device) => {
    device.monitorCharacteristicForService(
      "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
      "beb5483e-36e1-4688-b7f5-ea07361b26a8",
      (error, characteristic) => {
        if (error) {
          console.log("Error:", error);
          return;
        }
        if (characteristic?.value) {
          // Decode the batched IMU data (5 readings)
          const readings = decodeBatchIMUData(characteristic.value);

          if (readings) {
            console.log(`📊 Received ${readings.length} IMU readings:`);
            readings.forEach((reading, index) => {
              console.log(`\n  Reading #${index + 1}:`);
              console.log(`    Timestamp: ${reading.timestamp} ms`);
              console.log(`    Accel (g):`, reading.accel);
              console.log(`    Gyro (deg/s):`, reading.gyro);
              console.log(`    Mag:`, reading.mag);
              console.log(`    Temp: ${reading.temperature}°C`);
            });
          }
        }
      }
    );
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (connectedDevice) {
        bleManager.cancelDeviceConnection(connectedDevice.id);
      }
    };
  }, [connectedDevice]);

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    }
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    readData,
  };
}

export default useBLE;
