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
    // Node environment
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';
    console.log('🔧 Configured Firebase emulator hosts for Node environment');
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