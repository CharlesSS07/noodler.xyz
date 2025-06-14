/**
 * Test setup file for NodeBlueprintAPI tests
 * Configures Firebase emulators and test environment
 */

import { beforeAll } from 'vitest';

// Configure Firebase emulators before any tests run
beforeAll(() => {
  // Set emulator environment variables
  if (typeof window !== 'undefined') {
    // Browser environment - Firebase SDK will auto-detect emulators in dev mode
    console.log('🔧 Running in browser environment - Firebase emulators will auto-connect');
  } else {
    // Node environment - use 127.0.0.1 to match browser config
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = '127.0.0.1:5001';
    console.log('🔧 Configured Firebase emulator hosts for Node environment');
    console.log('[DEBUG] Environment variables:', {
      FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
      FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      NODE_ENV: process.env.NODE_ENV
    });
  }
  
  // Global test configuration
  console.log('🧪 Test environment initialized');
  console.log('  - Firebase Auth Emulator: localhost:9099');
  console.log('  - Firestore Emulator: localhost:8080');
  console.log('  - Functions Emulator: localhost:5001');
  console.log('  - Emulator UI: http://localhost:4000');
});

// Export test utilities if needed
export const TEST_TIMEOUT = 60000;
export const STRESS_TEST_TIMEOUT = 300000;