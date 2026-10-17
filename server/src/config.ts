import 'dotenv/config';

const required = ['DATABASE_URL'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const config = {
  port: Number(process.env.PORT || 8080),
  databaseUrl: process.env.DATABASE_URL!,
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  isProd: process.env.NODE_ENV === 'production',
  clientDist: process.env.CLIENT_DIST || '../../client/dist',
};
