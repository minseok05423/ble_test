import { Device } from "react-native-ble-plx";
import { decodeBatchIMUData } from "../utilis/decoding";
import { rightCharacteristicUUID, rightServiceUUID } from "./specification";

const readRight = async (device: Device) => {
  device.monitorCharacteristicForService(
    rightServiceUUID,
    rightCharacteristicUUID,
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
