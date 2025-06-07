
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  getSpeedTestHistoryInputSchema,
  createSpeedTestInputSchema 
} from './schema';
import { runSpeedTest } from './handlers/run_speed_test';
import { getSpeedTestHistory } from './handlers/get_speed_test_history';
import { getLatestSpeedTest } from './handlers/get_latest_speed_test';
import { saveSpeedTestResult } from './handlers/save_speed_test_result';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  runSpeedTest: publicProcedure
    .mutation(async ({ ctx }) => {
      // Extract user IP from request context or headers
      const userIp = '127.0.0.1'; // Default fallback, should be extracted from request
      return runSpeedTest(userIp);
    }),
    
  getSpeedTestHistory: publicProcedure
    .input(getSpeedTestHistoryInputSchema)
    .query(({ input }) => getSpeedTestHistory(input)),
    
  getLatestSpeedTest: publicProcedure
    .query(() => getLatestSpeedTest()),
    
  saveSpeedTestResult: publicProcedure
    .input(createSpeedTestInputSchema)
    .mutation(({ input }) => saveSpeedTestResult(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext(opts) {
      return {
        req: opts.req,
        res: opts.res,
      };
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
