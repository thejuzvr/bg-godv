#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config();

import { runBackgroundWorker } from './background-worker';

console.log('=== Starting ElderScrollsIdle Background Worker ===');
console.log('This process will keep characters alive even when offline...');

runBackgroundWorker().catch((error) => {
  console.error('Fatal error in background worker:', error);
  process.exit(1);
});
