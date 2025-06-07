
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { type CreateSpeedTestInput, type SpeedTestResult } from '../schema';

export const saveSpeedTestResult = async (input: CreateSpeedTestInput): Promise<SpeedTestResult> => {
  try {
    // Insert speed test result record
    const result = await db.insert(speedTestResultsTable)
      .values({
        download_speed: input.download_speed.toString(),
        upload_speed: input.upload_speed.toString(),
        ping: input.ping.toString(),
        jitter: input.jitter.toString(),
        server_location: input.server_location,
        user_ip: input.user_ip,
        test_duration: input.test_duration.toString()
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
    console.error('Speed test result save failed:', error);
    throw error;
  }
};
