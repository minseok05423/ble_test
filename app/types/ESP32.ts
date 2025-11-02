import { Device } from "react-native-ble-plx";

export default interface ESP32 {
  device: Device;
  id: string;
  side: "left" | "right";
  ServiceUUID: string;
  CharacteristicUUID: string;
}
