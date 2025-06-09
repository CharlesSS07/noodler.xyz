/**
 * Firebase Functions for Noodler Node Blueprint Management
 */

import { onCall, onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Configure emulator settings BEFORE initializing Firebase Admin
if (process.env.FUNCTIONS_EMULATOR) {
  // When running in Functions emulator, connect to other emulators
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
  logger.info("Functions emulator detected - configuring for local emulators");
  logger.info(`Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  logger.info(`Auth emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
}

// Initialize Firebase Admin
const app = initializeApp();

// Additional Firestore emulator configuration
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const db = getFirestore(app);
  db.settings({
    host: process.env.FIRESTORE_EMULATOR_HOST,
    ssl: false
  });
  logger.info(`Firestore configured for emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

// Import API modules
import { nodeBlueprintManipulationAPI } from "./api/nodeBlueprints";
import { nodeBlueprintSearchAPI } from "./api/nodeBlueprintSearch";

// Export Node Blueprint Manipulation APIs
export const getNodeBlueprint = onCall(nodeBlueprintManipulationAPI.get);
export const forkNodeBlueprint = onCall(nodeBlueprintManipulationAPI.fork);
export const createNodeBlueprint = onCall(nodeBlueprintManipulationAPI.create);
export const updateNodeBlueprintSpec = onCall(nodeBlueprintManipulationAPI.updateSpec);
export const updateNodeBlueprintDocs = onCall(nodeBlueprintManipulationAPI.updateDocs);
export const deployNodeBlueprint = onCall(nodeBlueprintManipulationAPI.deploy);

// Export Node Blueprint Search APIs
export const searchNodeBlueprintsByText = onCall(nodeBlueprintSearchAPI.searchByText);
export const searchNodeBlueprintsQuery = onCall(nodeBlueprintSearchAPI.query);
export const getRecommendedVersion = onCall(nodeBlueprintSearchAPI.getRecommendedVersion);

// Health check endpoint
export const healthCheck = onRequest((request, response) => {
  logger.info("Health check called", { structuredData: true });
  response.send({ status: "healthy", timestamp: new Date().toISOString() });
});