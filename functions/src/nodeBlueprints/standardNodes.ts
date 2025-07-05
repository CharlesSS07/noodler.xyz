import {generateStandardNodeSuite} from "./libs/FirestoreStandardNodeSet.js";

/**
 * Creates and configures runStandardNodeOperations nodes.
 * @return {Promise<void>} Promise that resolves when nodes are created
 */
export async function runStandardNodeOperations() {
  try {
    console.log("Starting standard node operations...");

    // Generate the standard node suite
    await generateStandardNodeSuite();
  } catch (error) {
    console.error("Error running standard node operations:", error);
    throw error;
  }
}
