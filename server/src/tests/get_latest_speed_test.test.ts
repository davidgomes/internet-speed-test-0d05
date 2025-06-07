
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { speedTestResultsTable } from '../db/schema';
import { getLatestSpeedTest } from '../handlers/get_latest_speed_test';

describe('getLatestSpeedTest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no speed tests exist', async () => {
    const result = await getLatestSpeedTest();
    expect(result).toBeNull();
  });

  it('should return the latest speed test result', async () => {
    // Insert multiple speed test results
    const testData = [
      {
        download_speed: '25.50',
        upload_speed: '5.75',
        ping: '12.30',
        jitter: '2.10',
        server_location: 'New York',
        user_ip: '192.168.1.1',
        test_duration: '8.50'
      },
      {
        download_speed: '30.25',
        upload_speed: '6.80',
        ping: '15.20',
        jitter: '3.45',
        server_location: 'Chicago',
        user_ip: '192.168.1.2',
        test_duration: '9.75'
      }
    ];

    // Insert first result
    await db.insert(speedTestResultsTable)
      .values(testData[0])
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second result (should be latest)
    await db.insert(speedTestResultsTable)
      .values(testData[1])
      .execute();

    const result = await getLatestSpeedTest();

    expect(result).not.toBeNull();
    expect(result!.download_speed).toEqual(30.25);
    expect(result!.upload_speed).toEqual(6.80);
    expect(result!.ping).toEqual(15.20);
    expect(result!.jitter).toEqual(3.45);
    expect(result!.server_location).toEqual('Chicago');
    expect(result!.user_ip).toEqual('192.168.1.2');
    expect(result!.test_duration).toEqual(9.75);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should convert numeric fields to numbers', async () => {
    // Insert a speed test result
    await db.insert(speedTestResultsTable)
      .values({
        download_speed: '100.50',
        upload_speed: '25.75',
        ping: '8.25',
        jitter: '1.50',
        server_location: 'Los Angeles',
        user_ip: '10.0.0.1',
        test_duration: '12.25'
      })
      .execute();

    const result = await getLatestSpeedTest();

    expect(result).not.toBeNull();
    expect(typeof result!.download_speed).toBe('number');
    expect(typeof result!.upload_speed).toBe('number');
    expect(typeof result!.ping).toBe('number');
    expect(typeof result!.jitter).toBe('number');
    expect(typeof result!.test_duration).toBe('number');
    expect(result!.download_speed).toEqual(100.50);
    expect(result!.upload_speed).toEqual(25.75);
    expect(result!.ping).toEqual(8.25);
    expect(result!.jitter).toEqual(1.50);
    expect(result!.test_duration).toEqual(12.25);
  });

  it('should return only the most recent result when multiple exist', async () => {
    // Insert three speed test results with slight delays
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      const inserted = await db.insert(speedTestResultsTable)
        .values({
          download_speed: (50 + i * 10).toString(),
          upload_speed: (10 + i * 2).toString(),
          ping: (20 - i).toString(),
          jitter: (2 + i * 0.5).toString(),
          server_location: `Server ${i + 1}`,
          user_ip: `192.168.1.${i + 1}`,
          test_duration: (10 + i).toString()
        })
        .returning()
        .execute();
      
      results.push(inserted[0]);
      
      // Small delay to ensure different timestamps
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const latestResult = await getLatestSpeedTest();

    expect(latestResult).not.toBeNull();
    expect(latestResult!.download_speed).toEqual(70); // Last inserted (50 + 2*10)
    expect(latestResult!.server_location).toEqual('Server 3');
    expect(latestResult!.user_ip).toEqual('192.168.1.3');
  });
});
