
import { z } from 'zod';

// Speed test result schema
export const speedTestResultSchema = z.object({
  id: z.number(),
  download_speed: z.number(), // Mbps
  upload_speed: z.number(), // Mbps
  ping: z.number(), // milliseconds
  jitter: z.number(), // milliseconds
  server_location: z.string(),
  user_ip: z.string(),
  test_duration: z.number(), // seconds
  created_at: z.coerce.date()
});

export type SpeedTestResult = z.infer<typeof speedTestResultSchema>;

// Input schema for creating speed test
export const createSpeedTestInputSchema = z.object({
  download_speed: z.number().positive(),
  upload_speed: z.number().positive(),
  ping: z.number().nonnegative(),
  jitter: z.number().nonnegative(),
  server_location: z.string(),
  user_ip: z.string(),
  test_duration: z.number().positive()
});

export type CreateSpeedTestInput = z.infer<typeof createSpeedTestInputSchema>;

// Speed test configuration schema
export const speedTestConfigSchema = z.object({
  test_file_size_mb: z.number().positive().default(10), // Size of test file in MB
  test_duration_seconds: z.number().positive().default(10), // Max test duration
  concurrent_connections: z.number().int().positive().default(4) // Number of parallel connections
});

export type SpeedTestConfig = z.infer<typeof speedTestConfigSchema>;

// Get speed test history input schema
export const getSpeedTestHistoryInputSchema = z.object({
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0)
});

export type GetSpeedTestHistoryInput = z.infer<typeof getSpeedTestHistoryInputSchema>;
