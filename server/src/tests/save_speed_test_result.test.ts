
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { type CreateSpeedTestInput } from '../schema';
import { saveSpeedTestResult } from '../handlers/save_speed_test_result';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateSpeedTestInput = {
  download_speed: 100.5,
  upload_speed: 50.25,
  ping: 15.3,
  jitter: 2.1,
  server_location: 'New York, NY',
  user_ip: '192.168.1.100',
  test_duration: 10.5
};

describe('saveSpeedTestResult', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save a speed test result', async () => {
    const result = await saveSpeedTestResult(testInput);

    // Basic field validation
    expect(result.download_speed).toEqual(100.5);
    expect(result.upload_speed).toEqual(50.25);
    expect(result.ping).toEqual(15.3);
    expect(result.jitter).toEqual(2.1);
    expect(result.server_location).toEqual('New York, NY');
    expect(result.user_ip).toEqual('192.168.1.100');
    expect(result.test_duration).toEqual(10.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save speed test result to database', async () => {
    const result = await saveSpeedTestResult(testInput);

    // Query database to verify record was saved
    const speedTestResults = await db.select()
      .from(speedTestResultsTable)
      .where(eq(speedTestResultsTable.id, result.id))
      .execute();

    expect(speedTestResults).toHaveLength(1);
    const savedResult = speedTestResults[0];
    
    expect(parseFloat(savedResult.download_speed)).toEqual(100.5);
    expect(parseFloat(savedResult.upload_speed)).toEqual(50.25);
    expect(parseFloat(savedResult.ping)).toEqual(15.3);
    expect(parseFloat(savedResult.jitter)).toEqual(2.1);
    expect(savedResult.server_location).toEqual('New York, NY');
    expect(savedResult.user_ip).toEqual('192.168.1.100');
    expect(parseFloat(savedResult.test_duration)).toEqual(10.5);
    expect(savedResult.created_at).toBeInstanceOf(Date);
  });

  it('should handle different numeric precision correctly', async () => {
    const precisionTestInput: CreateSpeedTestInput = {
      download_speed: 999.99,
      upload_speed: 0.01,
      ping: 1000.12,
      jitter: 0.1,
      server_location: 'Test Server',
      user_ip: '10.0.0.1',
      test_duration: 30.33
    };

    const result = await saveSpeedTestResult(precisionTestInput);

    // Verify numeric types are preserved
    expect(typeof result.download_speed).toBe('number');
    expect(typeof result.upload_speed).toBe('number');
    expect(typeof result.ping).toBe('number');
    expect(typeof result.jitter).toBe('number');
    expect(typeof result.test_duration).toBe('number');
    
    // Verify precision is maintained
    expect(result.download_speed).toEqual(999.99);
    expect(result.upload_speed).toEqual(0.01);
    expect(result.ping).toEqual(1000.12);
    expect(result.jitter).toEqual(0.1);
    expect(result.test_duration).toEqual(30.33);
  });

  it('should handle zero values correctly', async () => {
    const zeroTestInput: CreateSpeedTestInput = {
      download_speed: 50.0,
      upload_speed: 25.0,
      ping: 0,
      jitter: 0,
      server_location: 'Local Server',
      user_ip: '127.0.0.1',
      test_duration: 5.0
    };

    const result = await saveSpeedTestResult(zeroTestInput);

    expect(result.ping).toEqual(0);
    expect(result.jitter).toEqual(0);
    expect(result.download_speed).toEqual(50.0);
    expect(result.upload_speed).toEqual(25.0);
    expect(result.test_duration).toEqual(5.0);
  });
});
