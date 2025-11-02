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

export { decodeBatchIMUData };
