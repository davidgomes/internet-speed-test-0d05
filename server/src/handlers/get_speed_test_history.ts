
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { type GetSpeedTestHistoryInput, type SpeedTestResult } from '../schema';
import { desc } from 'drizzle-orm';

export const getSpeedTestHistory = async (input: GetSpeedTestHistoryInput): Promise<SpeedTestResult[]> => {
  try {
    // Build query with pagination and ordering
    const results = await db.select()
      .from(speedTestResultsTable)
      .orderBy(desc(speedTestResultsTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(result => ({
      ...result,
      download_speed: parseFloat(result.download_speed),
      upload_speed: parseFloat(result.upload_speed),
      ping: parseFloat(result.ping),
      jitter: parseFloat(result.jitter),
      test_duration: parseFloat(result.test_duration)
    }));
  } catch (error) {
    console.error('Failed to get speed test history:', error);
    throw error;
  }
};
