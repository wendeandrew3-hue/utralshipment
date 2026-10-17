// Vercel serverless entry point.
// The standalone Express server lives in server/src/index.ts; this exposes
// the exact same app as a Vercel Node function. All /api/* traffic is
// rewritten here by vercel.json. Static SPA routing is handled by Vercel.
import { createApp } from '../server/src/app';

const app = createApp();

export default app;
