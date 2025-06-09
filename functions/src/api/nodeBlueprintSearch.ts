/**
 * Node Blueprint Search API
 * Handles search and discovery of node blueprints
 */

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Get Firestore instance - will use emulator if configured
const db = getFirestore();

// Debug logging for emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  logger.info(`NodeBlueprintSearch API using Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

// Collections
const NODES_COLLECTION = "nodes";
const DEPLOYED_NODES_COLLECTION = "deployed_nodes";

interface SearchResult {
  nodeId: string;
  nodeKey: string;
  title: string;
  documentation: string;
  authorUid: string;
  createdAt: Date;
  isDeployed: boolean;
  trustLevel: string;
}

// Helper function to validate authentication
function validateAuth(request: CallableRequest): string {
  // For emulator testing, allow bypass of auth
  if (process.env.FUNCTIONS_EMULATOR && (!request.auth || !request.auth.uid)) {
    logger.info("Emulator mode: using test user ID");
    return "test-user-emulator";
  }
  
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  return request.auth.uid;
}

// Helper function to search in a collection
async function searchInCollection(collectionName: string, searchTerm: string, limit: number = 50): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Search by title and documentation in metadata
  const metadataQuery = db.collectionGroup("metadata")
    .limit(limit);

  const metadataSnapshot = await metadataQuery.get();
  const nodeKeys = new Set<string>();

  metadataSnapshot.forEach(doc => {
    const data = doc.data();
    const title = data.title?.toLowerCase() || "";
    const documentation = data.documentation?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();

    if (title.includes(searchLower) || documentation.includes(searchLower)) {
      // Extract node_key from the document path
      const pathParts = doc.ref.path.split('/');
      if (pathParts.length >= 2) {
        nodeKeys.add(pathParts[1]); // nodes/{node_key}/metadata/main
      }
    }
  });

  // Get the latest version for each matching node_key
  for (const nodeKey of nodeKeys) {
    try {
      const versionsQuery = db.collection(collectionName)
        .where("node_key", "==", nodeKey)
        .orderBy("created_at", "desc")
        .limit(1);

      const versionsSnapshot = await versionsQuery.get();
      
      if (!versionsSnapshot.empty) {
        const versionDoc = versionsSnapshot.docs[0];
        const versionData = versionDoc.data();
        
        results.push({
          nodeId: versionDoc.id,
          nodeKey: versionData.node_key,
          title: versionData.title || "",
          documentation: versionData.documentation || "",
          authorUid: versionData.author_uid,
          createdAt: versionData.created_at?.toDate() || new Date(),
          isDeployed: versionData.is_deployed || false,
          trustLevel: versionData.trust_level || "New"
        });
      }
    } catch (error) {
      logger.warn(`Error getting versions for node_key ${nodeKey}:`, error);
    }
  }

  return results;
}

export const nodeBlueprintSearchAPI = {
  // Search by title or documentation substring
  searchByText: async (request: CallableRequest): Promise<{ results: SearchResult[] }> => {
    try {
      validateAuth(request); // Only authenticated users can search
      const { substring, includeDeployed = true } = request.data;

      if (!substring || typeof substring !== "string") {
        throw new HttpsError("invalid-argument", "substring is required and must be a string");
      }

      if (substring.length < 2) {
        throw new HttpsError("invalid-argument", "Search term must be at least 2 characters");
      }

      logger.info(`Searching node blueprints by text: ${substring}`);

      const results: SearchResult[] = [];

      // Search in main collection
      const mainResults = await searchInCollection(NODES_COLLECTION, substring);
      results.push(...mainResults);

      // Search in deployed collection if requested
      if (includeDeployed) {
        const deployedResults = await searchInCollection(DEPLOYED_NODES_COLLECTION, substring);
        results.push(...deployedResults);
      }

      // Remove duplicates based on nodeId
      const uniqueResults = results.filter((result, index, self) => 
        index === self.findIndex(r => r.nodeId === result.nodeId)
      );

      // Sort by relevance (deployed first, then by creation date)
      uniqueResults.sort((a, b) => {
        if (a.isDeployed !== b.isDeployed) {
          return a.isDeployed ? -1 : 1; // Deployed first
        }
        return b.createdAt.getTime() - a.createdAt.getTime(); // Newer first
      });

      logger.info(`Found ${uniqueResults.length} results for search: ${substring}`);
      return { results: uniqueResults };
    } catch (error) {
      logger.error("Error searching node blueprints by text:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to search node blueprints");
    }
  },

  // Advanced query search (placeholder for vector search)
  query: async (request: CallableRequest): Promise<{ results: SearchResult[] }> => {
    try {
      validateAuth(request); // Only authenticated users can search
      const { query, llmAugment = false, project } = request.data;

      if (!query || typeof query !== "string") {
        throw new HttpsError("invalid-argument", "query is required and must be a string");
      }

      logger.info(`Advanced query search: ${query}`);

      // For now, this is a placeholder that falls back to text search
      // In the future, this would use vector embeddings and semantic search
      
      if (llmAugment) {
        logger.info("LLM augmentation requested but not implemented yet");
        // TODO: Implement LLM-augmented search
      }

      if (project) {
        logger.info("Project context provided but not implemented yet");
        // TODO: Use project context to improve search results
      }

      // Fallback to text search for now
      const textSearchResults = await nodeBlueprintSearchAPI.searchByText({
        ...request,
        data: { substring: query, includeDeployed: true }
      });

      return textSearchResults;
    } catch (error) {
      logger.error("Error in advanced query search:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to perform advanced search");
    }
  },

  // Get recommended version for a node key
  getRecommendedVersion: async (request: CallableRequest): Promise<{ nodeId: string | null }> => {
    try {
      const { nodeKey } = request.data;

      if (!nodeKey || typeof nodeKey !== "string") {
        throw new HttpsError("invalid-argument", "nodeKey is required and must be a string");
      }

      logger.info(`Getting recommended version for node key: ${nodeKey}`);

      // First, try to find the latest deployed version
      const deployedQuery = db.collection(DEPLOYED_NODES_COLLECTION)
        .where("node_key", "==", nodeKey)
        .orderBy("created_at", "desc")
        .limit(1);

      const deployedSnapshot = await deployedQuery.get();

      if (!deployedSnapshot.empty) {
        const deployedDoc = deployedSnapshot.docs[0];
        logger.info(`Found deployed version: ${deployedDoc.id}`);
        return { nodeId: deployedDoc.id };
      }

      // If no deployed version, get the latest development version
      const devQuery = db.collection(NODES_COLLECTION)
        .where("node_key", "==", nodeKey)
        .orderBy("created_at", "desc")
        .limit(1);

      const devSnapshot = await devQuery.get();

      if (!devSnapshot.empty) {
        const devDoc = devSnapshot.docs[0];
        logger.info(`Found development version: ${devDoc.id}`);
        return { nodeId: devDoc.id };
      }

      logger.info(`No version found for node key: ${nodeKey}`);
      return { nodeId: null };
    } catch (error) {
      logger.error("Error getting recommended version:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to get recommended version");
    }
  }
};