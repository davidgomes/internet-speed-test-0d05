
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { type SpeedTestResult } from '../schema';
import { desc } from 'drizzle-orm';

export const getLatestSpeedTest = async (): Promise<SpeedTestResult | null> => {
  try {
    const results = await db.select()
      .from(speedTestResultsTable)
      .orderBy(desc(speedTestResultsTable.created_at))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    
    // Convert numeric fields back to numbers
    return {
      id: result.id,
      download_speed: parseFloat(result.download_speed),
      upload_speed: parseFloat(result.upload_speed),
      ping: parseFloat(result.ping),
      jitter: parseFloat(result.jitter),
      server_location: result.server_location,
      user_ip: result.user_ip,
      test_duration: parseFloat(result.test_duration),
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Failed to get latest speed test:', error);
    throw error;
  }
};
