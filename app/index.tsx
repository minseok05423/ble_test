import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import DeviceModal from "../DeviceConnectionModal";
import useBLE from "../useBLE";

export default function Index() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
  } = useBLE();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const scanForDevices = async () => {
    const permissionsGranted = await requestPermissions();
    if (permissionsGranted) {
      scanForPeripherals();
    } else {
      console.log("Permissions not granted");
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>BLE Device Connection</Text>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status:</Text>
          <Text style={styles.value}>
            {connectedDevice ? "Connected" : "Not Connected"}
          </Text>
        </View>

        {/* Device Info */}
        {connectedDevice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Name:</Text>
            <Text style={styles.value}>
              {connectedDevice.name || "Unknown"}
            </Text>

            <Text style={styles.sectionTitle}>Device ID:</Text>
            <Text style={styles.valueSmall}>{connectedDevice.id}</Text>
          </View>
        )}

        {/* Raw Heart Rate Data */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart Rate Value:</Text>
          <Text style={styles.valueHuge}>{heartRate}</Text>
          <Text style={styles.label}>
            {heartRate > 0 ? "bpm (beats per minute)" : "Waiting for data..."}
          </Text>
        </View> */}

        {/* Number of Devices Found */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devices Found:</Text>
          <Text style={styles.value}>{allDevices.length}</Text>
        </View>
      </ScrollView>

      {/* Connect/Disconnect Button */}
      <TouchableOpacity
        onPress={connectedDevice ? disconnectFromDevice : openModal}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaButtonText}>
          {connectedDevice ? "Disconnect" : "Scan & Connect"}
        </Text>
      </TouchableOpacity>

      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    padding: 20,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
  },
  value: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  valueSmall: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    fontFamily: "monospace",
  },
  valueHuge: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#FF6060",
    marginTop: 10,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 60,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
