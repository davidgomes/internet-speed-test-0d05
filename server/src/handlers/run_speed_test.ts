
import { type CreateSpeedTestInput, type SpeedTestResult } from '../schema';

export declare function runSpeedTest(userIp: string): Promise<SpeedTestResult>;
