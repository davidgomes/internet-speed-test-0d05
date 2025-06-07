
import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const speedTestResultsTable = pgTable('speed_test_results', {
  id: serial('id').primaryKey(),
  download_speed: numeric('download_speed', { precision: 10, scale: 2 }).notNull(), // Mbps
  upload_speed: numeric('upload_speed', { precision: 10, scale: 2 }).notNull(), // Mbps
  ping: numeric('ping', { precision: 8, scale: 2 }).notNull(), // milliseconds
  jitter: numeric('jitter', { precision: 8, scale: 2 }).notNull(), // milliseconds
  server_location: text('server_location').notNull(),
  user_ip: text('user_ip').notNull(),
  test_duration: numeric('test_duration', { precision: 6, scale: 2 }).notNull(), // seconds
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type SpeedTestResult = typeof speedTestResultsTable.$inferSelect;
export type NewSpeedTestResult = typeof speedTestResultsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { speedTestResults: speedTestResultsTable };
