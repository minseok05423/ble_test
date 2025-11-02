import { useEffect, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  allDevices: Device[];
  connectToDevice: (device: Device) => Promise<void>;
  connectedDevices: Device[];
  disconnectFromDevice: (deviceId?: string) => void;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);

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
      // Check if already connected
      if (connectedDevices.find((d) => d.id === device.id)) {
        console.log("Device already connected");
        return;
      }

      if (connectedDevices.length >= 2) {
        console.log("Maximum 2 devices already connected");
        return;
      }

      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevices((prev) => [...prev, deviceConnection]);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
    };
  }, [bleManager]);

  const disconnectFromDevice = (deviceId?: string) => {
    if (deviceId) {
      // Disconnect specific device
      bleManager.cancelDeviceConnection(deviceId);
      setConnectedDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } else {
      // Disconnect all devices
      connectedDevices.forEach((device) => {
        bleManager.cancelDeviceConnection(device.id);
      });
      setConnectedDevices([]);
    }
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevices,
    disconnectFromDevice,
  };
}

export default useBLE;
