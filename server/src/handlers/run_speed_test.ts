
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { type SpeedTestResult } from '../schema';

export const runSpeedTest = async (userIp: string): Promise<SpeedTestResult> => {
  try {
    // Simulate running a speed test
    // In a real implementation, this would perform actual network tests
    const downloadSpeed = Math.random() * 100 + 50; // 50-150 Mbps
    const uploadSpeed = Math.random() * 50 + 20; // 20-70 Mbps
    const ping = Math.random() * 50 + 10; // 10-60 ms
    const jitter = Math.random() * 10 + 1; // 1-11 ms
    const testDuration = Math.random() * 5 + 8; // 8-13 seconds
    
    // Mock server locations
    const serverLocations = ['New York', 'Los Angeles', 'Chicago', 'Dallas', 'Miami'];
    const serverLocation = serverLocations[Math.floor(Math.random() * serverLocations.length)];

    // Insert speed test result
    const result = await db.insert(speedTestResultsTable)
      .values({
        download_speed: downloadSpeed.toString(),
        upload_speed: uploadSpeed.toString(),
        ping: ping.toString(),
        jitter: jitter.toString(),
        server_location: serverLocation,
        user_ip: userIp,
        test_duration: testDuration.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const speedTestResult = result[0];
    return {
      ...speedTestResult,
      download_speed: parseFloat(speedTestResult.download_speed),
      upload_speed: parseFloat(speedTestResult.upload_speed),
      ping: parseFloat(speedTestResult.ping),
      jitter: parseFloat(speedTestResult.jitter),
      test_duration: parseFloat(speedTestResult.test_duration)
    };
  } catch (error) {
    console.error('Speed test failed:', error);
    throw error;
  }
};
