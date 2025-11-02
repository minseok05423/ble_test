import { Buffer } from "buffer";
import { Device } from "react-native-ble-plx";

const sendSyncPacket = async (rightDevice: Device | undefined) => {
  // Get current timestamp in milliseconds
  const timestamp = Date.now();
  console.log("Sending sync timestamp:", timestamp);

  // Convert timestamp to 4-byte buffer (uint32, little-endian)
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(timestamp & 0xffffffff, 0);
  const base64Data = buffer.toString("base64");

  console.log("Base64 sync data:", base64Data);

  // Send to right device
  if (rightDevice) {
    const services = await rightDevice.services();
    const rightServiceUUID = services[0]?.uuid;
    const rightCharacteristicUUID = await rightDevice
      .characteristicsForService(rightServiceUUID)
      .then((characteristics) => characteristics[0]?.uuid);

    try {
      await rightDevice.writeCharacteristicWithResponseForService(
        rightServiceUUID,
        rightCharacteristicUUID,
        base64Data
      );
      console.log("Sync packet sent to right device");
    } catch (error) {
      console.log("Failed to sync right device:", error);
    }
  }
};

export { sendSyncPacket };
