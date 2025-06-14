/**
 * Test setup file for NodeBlueprintAPI tests
 * Configures Firebase emulators and test environment
 */

import { beforeAll } from 'vitest';

// Configure Firebase emulators before any tests run
beforeAll(() => {
  console.log('[DEBUG] Environment check:', {
    hasWindow: typeof window !== 'undefined',
    isNode: typeof process !== 'undefined',
    currentFIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST
  });
  
  // Always set emulator environment variables for tests
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = '127.0.0.1:5001';
  console.log('🔧 Forced Firebase emulator configuration for test environment');
  console.log('[DEBUG] Environment variables after setup:', {
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    NODE_ENV: process.env.NODE_ENV
  });
  
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