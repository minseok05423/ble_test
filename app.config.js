module.exports = {
  expo: {
    name: "ble_example",
    slug: "ble_example",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "bleexample",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.minseok05423.bleexample",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSBluetoothAlwaysUsageDescription: "This app uses Bluetooth to connect to heart rate monitors and other BLE devices.",
        NSBluetoothPeripheralUsageDescription: "This app uses Bluetooth to connect to heart rate monitors and other BLE devices.",
      },
    },
    android: {
      package: "com.minseok05423",
      permissions: [
        "BLUETOOTH",
        "BLUETOOTH_ADMIN",
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN",
        "ACCESS_FINE_LOCATION",
      ],
    },
    plugins: [
      "expo-router",
      "react-native-ble-plx"
    ],
    extra: {
      eas: {
        projectId: "039f0c9e-b66f-44fe-ab4f-d6d4af9cdb5c",
      },
    },
  },
};
