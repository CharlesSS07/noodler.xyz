import {genkit} from "genkit";
import {gemini15Flash, googleAI, textEmbedding004} from "@genkit-ai/googleai";
import {defineFirestoreRetriever} from "@genkit-ai/firebase";
import {FieldValue} from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import {NodeBluePrintInFirestore} from "./libs/FirestoreNodeBluePrint";
import {SearchOptions, SearchResult} from "$shared/types/Search";

// Configure Genkit instance
const ai = genkit({
  plugins: [googleAI()], // Will use GOOGLE_GENAI_API_KEY env var
  model: gemini15Flash, // set default model
});

const firestore = admin.firestore();

// Configuration for the vector index
const vectorDbIndexConfig = {
  collection: "node_embeddings", // Separate collection for embeddings
  contentField: "text",
  vectorField: "embedding",
  embedder: textEmbedding004,
};

// Configuration for the NodeBluePrint collection
const nodesBluePrintConfig = {
  collection: "nodes",
};

// Define the Firestore retriever for vector search
const retriever = defineFirestoreRetriever(ai, {
  name: "nodeBluePrintRetriever",
  firestore,
  collection: vectorDbIndexConfig.collection,
  contentField: vectorDbIndexConfig.contentField,
  vectorField: vectorDbIndexConfig.vectorField,
  embedder: vectorDbIndexConfig.embedder,
  distanceMeasure: "COSINE",
});


/**
 * Converts a NodeBluePrint to a text description for embedding
 * @param {string} nid - The NodeBluePrint ID
 * @return {Promise<string>} Text description of the NodeBluePrint
 */
export async function nodeBluePrintToText(nid: string): Promise<string> {
  try {
    // Try to use the proper NodeBluePrint class first
    const nodeBluePrint = new NodeBluePrintInFirestore(nid);

    try {
      // Wait for the node to be initialized from Firestore
      await nodeBluePrint.waitForInitialization();

      // Use the built-in toString method from NodeBluePrint
      const text = nodeBluePrint.toString();

      // Clean up the subscription to prevent memory leaks
      nodeBluePrint.destroy();

      return text;
    } catch (classError) {
      // If the class approach fails (e.g., due to missing owner field),
      // fall back to direct Firestore reading
      console.warn(
        `NodeBluePrint class approach failed for ${nid}, falling back:`,
        classError.message
      );

      // Clean up the failed instance
      nodeBluePrint.destroy();

      // Fall back to direct Firestore reading for compatibility
      const doc = await firestore
        .collection(nodesBluePrintConfig.collection)
        .doc(nid).get();

      if (!doc.exists) {
        throw new Error(`NodeBluePrint with nid ${nid} not found`);
      }

      const data = doc.data();

      // Use the NodeBluePrint toString logic directly
      const parts: string[] = [];

      // Add title
      if (data.title) {
        parts.push(`Title: ${data.title}`);
      }

      // Add documentation/description
      if (data.documentation) {
        parts.push(`Description: ${data.documentation}`);
      }

      // Add tags
      if (data.tags && data.tags.length > 0) {
        parts.push(`Tags: ${data.tags.join(", ")}`);
      }

      // Add trust level
      if (data.trust_level) {
        parts.push(`Trust Level: ${data.trust_level}`);
      }

      // Add input specifications
      if (data.input_sockets && data.input_sockets.length > 0) {
        const inputSpecs = data.input_sockets.map((socket) => {
          const key = socket.key || socket.id;
          const type = socket.type || socket.dataType || "unknown";
          const desc = socket.description || socket.label || "";
          return `${key}: ${type} - ${desc}`;
        }).join("; ");
        parts.push(`Input Sockets: ${inputSpecs}`);
      }

      // Add output specifications
      if (data.output_sockets && data.output_sockets.length > 0) {
        const outputSpecs = data.output_sockets.map((socket) => {
          const key = socket.key || socket.id;
          const type = socket.type || socket.dataType || "unknown";
          const desc = socket.description || socket.label || "";
          return `${key}: ${type} - ${desc}`;
        }).join("; ");
        parts.push(`Output Sockets: ${outputSpecs}`);
      }

      return parts.join("\n\n");
    }
  } catch (error) {
    console.error(`Error converting NodeBluePrint ${nid} to text:`, error);
    throw error;
  }
}

/**
 * Clears all vector embeddings from the index
 * @return {Promise<{deletedCount: number}>} Result of the operation
 */
export async function clearAllVectorEmbeddings():
  Promise<{deletedCount: number}> {
  try {
    const snapshot = await firestore
      .collection(vectorDbIndexConfig.collection)
      .get();
    const deletedCount = snapshot.size;

    for (const doc of snapshot.docs) {
      await removeNodeBluePrintEmbeddingFromIndex(doc.id);
    }

    return {deletedCount};
  } catch (error) {
    console.error("Error clearing vector embeddings:", error);
    throw error;
  }
}

/**
 * Embeds a single NodeBluePrint in the vector index
 * @param {string} nid - The NodeBluePrint ID to embed
 * @return {Promise<{success: boolean, nid: string}>} Result of the operation
 */
export async function embedNodeBluePrint(nid: string): Promise<void> {
  if (!nid) {
    throw new Error("NodeBluePrint ID (nid) is required");
  }

  try {
    // Get the text representation using NodeBluePrint.toString()
    const nodeBluePrint = new NodeBluePrintInFirestore(nid);
    await nodeBluePrint.waitForInitialization();
    const text = nodeBluePrint.toString();
    nodeBluePrint.destroy();

    // Generate embedding
    const embedding = (await ai.embed({
      embedder: vectorDbIndexConfig.embedder,
      content: text,
    }))[0].embedding;

    // Store in embeddings collection (no need to read from nodes collection)
    await firestore.collection(vectorDbIndexConfig.collection).doc(nid).set({
      nid,
      [vectorDbIndexConfig.vectorField]: FieldValue.vector(embedding),
      [vectorDbIndexConfig.contentField]: text,
      embeddingValid: true,
      created_at: new Date(),
      last_updated_at: new Date(),
    });

    return;
  } catch (error) {
    console.error(`Error embedding NodeBluePrint ${nid}:`, error);
    throw error;
  }
}

/**
 * Removes a NodeBluePrint embedding from the vector index
 * @param {string} nid - The NodeBluePrint ID to remove embedding for
 * @return {Promise<void>} Result of the operation
 */
export async function removeNodeBluePrintEmbeddingFromIndex(
  nid: string
): Promise<void> {
  if (!nid) {
    throw new Error("NodeBluePrint ID (nid) is required");
  }

  try {
    await firestore.collection(vectorDbIndexConfig.collection).doc(nid)
      .delete();
    return;
  } catch (error) {
    console.error(
      `Error removing NodeBluePrint embedding ${nid} from index:`,
      error
    );
    throw error;
  }
}

/**
 * Re-embeds a single NodeBluePrint in the vector index
 * @param {string} nid - The NodeBluePrint ID to re-embed
 * @return {Promise<{success: boolean, nid: string}>} Result of the operation
 */
export async function reEmbedNodeBluePrint(nid: string): Promise<void> {
  if (!nid) {
    throw new Error("NodeBluePrint ID (nid) is required");
  }

  try {
    // Remove existing embedding
    await removeNodeBluePrintEmbeddingFromIndex(nid);

    // Re-embed
    await embedNodeBluePrint(nid);

    return;
  } catch (error) {
    console.error(`Error re-embedding NodeBluePrint ${nid}:`, error);
    throw error;
  }
}

/**
 * Re-embeds all searchable NodeBluePrints in the vector index
 * @return {Promise<{processed: number, errors: number,
 *   errorDetails: Array<{nid: string, error: string}>}>} Result
 */
export async function reEmbedAllNodeBluePrints(): Promise<{
  processed: number;
  errors: number;
  errorDetails: Array<{nid: string, error: string}>;
}> {
  try {
    // Get all searchable NodeBluePrints from the nodes collection
    const snapshot = await firestore
      .collection(nodesBluePrintConfig.collection)
      .where("searchable", "==", true)
      .get();

    const results = [];
    const errors = [];

    // Process each node
    for (const doc of snapshot.docs) {
      try {
        const nid = doc.id;
        await reEmbedNodeBluePrint(nid);
        results.push(nid);
      } catch (error) {
        console.error(`Error processing NodeBluePrint ${doc.id}:`, error);
        errors.push({nid: doc.id, error: error.toString()});
      }
    }

    return {
      processed: results.length,
      errors: errors.length,
      errorDetails: errors,
    };
  } catch (error) {
    console.error("Error re-embedding all NodeBluePrints:", error);
    throw error;
  }
}

/**
 * Embeds all searchable NodeBluePrints that do not have an embedding
 * yet in the vector index
 * @return {Promise<{processed: number, errors: number,
 *   errorDetails: Array<{nid: string, error: string}>}>} Result
 */
export async function embedAllUnembeddedNodeBluePrints(): Promise<{
  processed: number;
  errors: number;
  errorDetails: Array<{nid: string, error: string}>;
}> {
  try {
    // Get all searchable NodeBluePrints from the nodes collection
    const nodesSnapshot = await firestore
      .collection(nodesBluePrintConfig.collection)
      .where("searchable", "==", true)
      .get();

    const results = [];
    const errors = [];

    // Check each searchable node to see if it has a valid embedding
    for (const nodeDoc of nodesSnapshot.docs) {
      try {
        const nid = nodeDoc.id;

        // Check if embedding exists and is valid
        const embeddingDoc = await firestore
          .collection(vectorDbIndexConfig.collection)
          .doc(nid)
          .get();

        const hasValidEmbedding = embeddingDoc.exists &&
          embeddingDoc.data()?.embeddingValid === true;

        if (!hasValidEmbedding) {
          await reEmbedNodeBluePrint(nid);
          results.push(nid);
        }
      } catch (error) {
        console.error(`Error processing NodeBluePrint ${nodeDoc.id}:`, error);
        errors.push({nid: nodeDoc.id, error: error.toString()});
      }
    }

    return {
      processed: results.length,
      errors: errors.length,
      errorDetails: errors,
    };
  } catch (error) {
    console.error("Error re-embedding all NodeBluePrints:", error);
    throw error;
  }
}

/**
 * Performs vector search on NodeBluePrints
 * @param {SearchOptions} options - Search parameters
 * @return {Promise<{results: SearchResult[], totalFound: number}>}
 *   Search results
 */
export async function searchNodeBluePrints(
  options: SearchOptions
): Promise<{results: SearchResult[], totalFound: number}> {
  const {query, limit = 10, trustLevelFilter, tagFilter} = options;

  if (!query) {
    throw new Error("Search query is required");
  }

  try {
    // Prepare search options
    const searchOptions: {
      limit: number;
      where?: {[key: string]: unknown};
    } = {
      limit: Math.min(limit, 50), // Cap at 50 results
    };

    // Add filters if provided
    const whereConditions: {[key: string]: unknown} = {};
    // Always filter for valid embeddings
    whereConditions["embeddingValid"] = true;

    if (trustLevelFilter) {
      whereConditions["trust_level"] = trustLevelFilter;
    }
    if (tagFilter && tagFilter.length > 0) {
      whereConditions["tags"] = tagFilter;
    }

    if (Object.keys(whereConditions).length > 0) {
      searchOptions.where = whereConditions;
    }

    // Perform vector search
    const docs = await ai.retrieve({
      retriever,
      query,
      options: searchOptions,
    });

    // Format results
    const results: SearchResult[] = docs
      .filter((doc) => doc.metadata?.nid !== undefined)
      .map((doc) => ({
        nid: doc.metadata?.nid || "",
        similarity: doc.metadata?.similarity,
      })
      );

    return {
      results,
      totalFound: results.length,
    };
  } catch (error) {
    console.error("Error performing vector search:", error);
    throw error;
  }
  throw new Error("searchNodeBluePrints called");
}
