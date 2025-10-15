import dotenv from 'dotenv';

export function loadEnv(): void {
  // Base
  dotenv.config({ path: '.env', override: false });
  dotenv.config({ path: '.env.local', override: true });

  // Environment-specific
  const nodeEnv = process.env.NODE_ENV || 'development';
  dotenv.config({ path: `.env.${nodeEnv}`, override: false });
  dotenv.config({ path: `.env.${nodeEnv}.local`, override: true });
}


