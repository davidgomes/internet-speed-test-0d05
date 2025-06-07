
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { runSpeedTest } from '../handlers/run_speed_test';
import { eq } from 'drizzle-orm';

describe('runSpeedTest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should run a speed test and return results', async () => {
    const userIp = '192.168.1.100';
    const result = await runSpeedTest(userIp);

    // Basic field validation
    expect(result.user_ip).toEqual(userIp);
    expect(result.server_location).toBeDefined();
    expect(typeof result.server_location).toBe('string');
    expect(result.server_location.length).toBeGreaterThan(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Validate numeric fields are numbers
    expect(typeof result.download_speed).toBe('number');
    expect(typeof result.upload_speed).toBe('number');
    expect(typeof result.ping).toBe('number');
    expect(typeof result.jitter).toBe('number');
    expect(typeof result.test_duration).toBe('number');

    // Validate reasonable ranges for speed test metrics
    expect(result.download_speed).toBeGreaterThan(0);
    expect(result.upload_speed).toBeGreaterThan(0);
    expect(result.ping).toBeGreaterThan(0);
    expect(result.jitter).toBeGreaterThan(0);
    expect(result.test_duration).toBeGreaterThan(0);
  });

  it('should save speed test result to database', async () => {
    const userIp = '10.0.0.1';
    const result = await runSpeedTest(userIp);

    // Query database to verify the result was saved
    const savedResults = await db.select()
      .from(speedTestResultsTable)
      .where(eq(speedTestResultsTable.id, result.id))
      .execute();

    expect(savedResults).toHaveLength(1);
    const saved = savedResults[0];
    
    expect(saved.user_ip).toEqual(userIp);
    expect(saved.server_location).toEqual(result.server_location);
    expect(saved.created_at).toBeInstanceOf(Date);
    
    // Verify numeric fields are stored as strings but match our converted values
    expect(parseFloat(saved.download_speed)).toEqual(result.download_speed);
    expect(parseFloat(saved.upload_speed)).toEqual(result.upload_speed);
    expect(parseFloat(saved.ping)).toEqual(result.ping);
    expect(parseFloat(saved.jitter)).toEqual(result.jitter);
    expect(parseFloat(saved.test_duration)).toEqual(result.test_duration);
  });

  it('should generate different results for different test runs', async () => {
    const userIp = '172.16.0.1';
    
    // Run multiple speed tests
    const result1 = await runSpeedTest(userIp);
    const result2 = await runSpeedTest(userIp);
    const result3 = await runSpeedTest(userIp);

    // Results should be different (very unlikely to be identical due to randomization)
    expect(result1.download_speed).not.toEqual(result2.download_speed);
    expect(result2.upload_speed).not.toEqual(result3.upload_speed);
    expect(result1.ping).not.toEqual(result3.ping);

    // All should have the same user IP
    expect(result1.user_ip).toEqual(userIp);
    expect(result2.user_ip).toEqual(userIp);
    expect(result3.user_ip).toEqual(userIp);

    // All should have valid server locations
    expect(result1.server_location).toBeDefined();
    expect(result2.server_location).toBeDefined();
    expect(result3.server_location).toBeDefined();
  });

  it('should handle different IP address formats', async () => {
    const ipv4 = '203.0.113.1';
    const result1 = await runSpeedTest(ipv4);
    expect(result1.user_ip).toEqual(ipv4);

    const privateIp = '192.168.0.100';
    const result2 = await runSpeedTest(privateIp);
    expect(result2.user_ip).toEqual(privateIp);

    const localhostIp = '127.0.0.1';
    const result3 = await runSpeedTest(localhostIp);
    expect(result3.user_ip).toEqual(localhostIp);

    // All results should be saved to database
    const allResults = await db.select()
      .from(speedTestResultsTable)
      .execute();

    expect(allResults.length).toBeGreaterThanOrEqual(3);
  });
});
