
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { type GetSpeedTestHistoryInput, type CreateSpeedTestInput } from '../schema';
import { getSpeedTestHistory } from '../handlers/get_speed_test_history';

// Helper function to create test speed test results
const createTestSpeedTestResult = async (data: Partial<CreateSpeedTestInput> = {}) => {
  const testData: CreateSpeedTestInput = {
    download_speed: 100.5,
    upload_speed: 50.25,
    ping: 15.75,
    jitter: 2.5,
    server_location: 'New York, NY',
    user_ip: '192.168.1.1',
    test_duration: 10.5,
    ...data
  };

  return await db.insert(speedTestResultsTable)
    .values({
      download_speed: testData.download_speed.toString(),
      upload_speed: testData.upload_speed.toString(),
      ping: testData.ping.toString(),
      jitter: testData.jitter.toString(),
      server_location: testData.server_location,
      user_ip: testData.user_ip,
      test_duration: testData.test_duration.toString()
    })
    .returning()
    .execute();
};

describe('getSpeedTestHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no results exist', async () => {
    const input: GetSpeedTestHistoryInput = { limit: 10, offset: 0 };
    const results = await getSpeedTestHistory(input);

    expect(results).toEqual([]);
  });

  it('should return speed test results with correct numeric conversions', async () => {
    // Create test data
    await createTestSpeedTestResult();

    const input: GetSpeedTestHistoryInput = { limit: 10, offset: 0 };
    const results = await getSpeedTestHistory(input);

    expect(results).toHaveLength(1);
    const result = results[0];

    // Verify all numeric fields are properly converted
    expect(typeof result.download_speed).toBe('number');
    expect(typeof result.upload_speed).toBe('number');
    expect(typeof result.ping).toBe('number');
    expect(typeof result.jitter).toBe('number');
    expect(typeof result.test_duration).toBe('number');

    expect(result.download_speed).toEqual(100.5);
    expect(result.upload_speed).toEqual(50.25);
    expect(result.ping).toEqual(15.75);
    expect(result.jitter).toEqual(2.5);
    expect(result.test_duration).toEqual(10.5);
    expect(result.server_location).toEqual('New York, NY');
    expect(result.user_ip).toEqual('192.168.1.1');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should return results ordered by created_at descending', async () => {
    // Create multiple test results with small delays to ensure different timestamps
    await createTestSpeedTestResult({ download_speed: 100 });
    await new Promise(resolve => setTimeout(resolve, 10));
    await createTestSpeedTestResult({ download_speed: 200 });
    await new Promise(resolve => setTimeout(resolve, 10));
    await createTestSpeedTestResult({ download_speed: 300 });

    const input: GetSpeedTestHistoryInput = { limit: 10, offset: 0 };
    const results = await getSpeedTestHistory(input);

    expect(results).toHaveLength(3);
    
    // Results should be ordered by created_at descending (newest first)
    expect(results[0].download_speed).toEqual(300);
    expect(results[1].download_speed).toEqual(200);
    expect(results[2].download_speed).toEqual(100);

    // Verify timestamps are in descending order
    expect(results[0].created_at >= results[1].created_at).toBe(true);
    expect(results[1].created_at >= results[2].created_at).toBe(true);
  });

  it('should respect limit parameter', async () => {
    // Create 5 test results
    for (let i = 0; i < 5; i++) {
      await createTestSpeedTestResult({ download_speed: 100 + i });
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const input: GetSpeedTestHistoryInput = { limit: 3, offset: 0 };
    const results = await getSpeedTestHistory(input);

    expect(results).toHaveLength(3);
  });

  it('should respect offset parameter', async () => {
    // Create 5 test results
    for (let i = 0; i < 5; i++) {
      await createTestSpeedTestResult({ download_speed: 100 + i });
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const input: GetSpeedTestHistoryInput = { limit: 10, offset: 2 };
    const results = await getSpeedTestHistory(input);

    expect(results).toHaveLength(3); // 5 total - 2 offset = 3 remaining
  });

  it('should use default values correctly', async () => {
    // Create more than 50 results to test default limit
    for (let i = 0; i < 55; i++) {
      await createTestSpeedTestResult({ download_speed: 100 + i });
    }

    // Test with defaults (limit: 50, offset: 0) - provide explicit values since Zod defaults are applied at parse time
    const input: GetSpeedTestHistoryInput = { limit: 50, offset: 0 };
    const results = await getSpeedTestHistory(input);

    expect(results).toHaveLength(50); // Should return 50 results
  });
});
