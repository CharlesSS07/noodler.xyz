/**
 * Node Blueprint Manipulation API
 * Handles CRUD operations for node blueprints
 */

import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
const { v4: uuidv4 } = require("uuid");

// Get Firestore instance - will use emulator if configured
const db = getFirestore();

// Debug logging for emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  logger.info(`NodeBlueprints API using Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

// Collections
const NODES_COLLECTION = "nodes";
const DEPLOYED_NODES_COLLECTION = "deployed_nodes";

interface NodeBlueprintData {
  node_key: string;
  author_uid: string;
  created_at: Date;
  predecessor_nid?: string;
  title: string;
  documentation: string;
  user_defined_code_snippet: string;
  input_sockets: Record<string, any>;
  input_socket_order: string[];
  output_sockets: Record<string, any>;
  output_socket_order: string[];
  trust_level: string;
  official_note: string;
  last_updated_at: Date;
  is_deployed: boolean;
}

// Helper function to validate authentication
function validateAuth(request: CallableRequest): string {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }
  return request.auth.uid;
}

// Helper function to get node reference
function getNodeRef(nodeId: string) {
  return db.collection(NODES_COLLECTION).doc(nodeId);
}

// Helper function to get deployed node reference
function getDeployedNodeRef(nodeId: string) {
  return db.collection(DEPLOYED_NODES_COLLECTION).doc(nodeId);
}

export const nodeBlueprintManipulationAPI = {
  // Get node blueprint data
  get: async (request: CallableRequest): Promise<NodeBlueprintData | null> => {
    try {
      const { nodeId } = request.data;
      
      if (!nodeId) {
        throw new HttpsError("invalid-argument", "nodeId is required");
      }

      logger.info(`Getting node blueprint: ${nodeId}`);

      // Try to get from main collection first
      let nodeDoc = await getNodeRef(nodeId).get();
      
      // If not found, try deployed collection
      if (!nodeDoc.exists) {
        nodeDoc = await getDeployedNodeRef(nodeId).get();
      }

      if (!nodeDoc.exists) {
        return null;
      }

      const data = nodeDoc.data() as NodeBlueprintData;
      return data;
    } catch (error) {
      logger.error("Error getting node blueprint:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to get node blueprint");
    }
  },

  // Fork an existing node blueprint
  fork: async (request: CallableRequest): Promise<{ nodeId: string }> => {
    try {
      const authorUid = validateAuth(request);
      const { nodeId } = request.data;

      if (!nodeId) {
        throw new HttpsError("invalid-argument", "nodeId is required");
      }

      logger.info(`Forking node blueprint: ${nodeId} by user: ${authorUid}`);

      // Get the original node
      let originalDoc = await getNodeRef(nodeId).get();
      if (!originalDoc.exists) {
        originalDoc = await getDeployedNodeRef(nodeId).get();
      }

      if (!originalDoc.exists) {
        throw new HttpsError("not-found", "Original node blueprint not found");
      }

      const originalData = originalDoc.data() as NodeBlueprintData;
      
      // Create new node with forked data
      const newNodeKey = `fork_${originalData.node_key}_${uuidv4()}`;
      const createdAt = new Date();
      const newNodeId = `${newNodeKey}/versions/${authorUid}:${createdAt.getTime()}`;

      const forkedData: NodeBlueprintData = {
        ...originalData,
        node_key: newNodeKey,
        author_uid: authorUid,
        created_at: createdAt,
        predecessor_nid: nodeId,
        title: `Fork of ${originalData.title}`,
        last_updated_at: createdAt,
        is_deployed: false,
        trust_level: "New"
      };

      // Save the forked node
      await getNodeRef(newNodeId).set(forkedData);
      
      // Save metadata separately
      const metadataRef = db.collection(NODES_COLLECTION).doc(newNodeKey).collection("metadata").doc("main");
      await metadataRef.set({
        title: forkedData.title,
        documentation: forkedData.documentation
      });

      logger.info(`Successfully forked node: ${newNodeId}`);
      return { nodeId: newNodeId };
    } catch (error) {
      logger.error("Error forking node blueprint:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to fork node blueprint");
    }
  },

  // Create a new empty node blueprint
  create: async (request: CallableRequest): Promise<{ nodeId: string }> => {
    try {
      const authorUid = validateAuth(request);
      const { hint } = request.data || {};

      logger.info(`Creating new node blueprint by user: ${authorUid}`);

      // Create new node
      const nodeKey = `node_${hint || 'custom'}_${uuidv4()}`;
      const createdAt = new Date();
      const nodeId = `${nodeKey}/versions/${authorUid}:${createdAt.getTime()}`;

      const newNodeData: NodeBlueprintData = {
        node_key: nodeKey,
        author_uid: authorUid,
        created_at: createdAt,
        title: "Untitled Operation",
        documentation: "",
        user_defined_code_snippet: 'console.log("Hello World");',
        input_sockets: {},
        input_socket_order: [],
        output_sockets: {},
        output_socket_order: [],
        trust_level: "New",
        official_note: "",
        last_updated_at: createdAt,
        is_deployed: false
      };

      // Save the new node
      await getNodeRef(nodeId).set(newNodeData);
      
      // Save metadata separately
      const metadataRef = db.collection(NODES_COLLECTION).doc(nodeKey).collection("metadata").doc("main");
      await metadataRef.set({
        title: newNodeData.title,
        documentation: newNodeData.documentation
      });

      logger.info(`Successfully created node: ${nodeId}`);
      return { nodeId };
    } catch (error) {
      logger.error("Error creating node blueprint:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to create node blueprint");
    }
  },

  // Update node specification (sockets and code)
  updateSpec: async (request: CallableRequest): Promise<{ success: boolean }> => {
    try {
      const authorUid = validateAuth(request);
      const { nodeId, newSpec, newCode } = request.data;

      if (!nodeId) {
        throw new HttpsError("invalid-argument", "nodeId is required");
      }

      logger.info(`Updating node spec: ${nodeId} by user: ${authorUid}`);

      const nodeRef = getNodeRef(nodeId);
      const nodeDoc = await nodeRef.get();

      if (!nodeDoc.exists) {
        throw new HttpsError("not-found", "Node blueprint not found");
      }

      const nodeData = nodeDoc.data() as NodeBlueprintData;

      // Check if node is deployed (readonly)
      if (nodeData.is_deployed) {
        throw new HttpsError("permission-denied", "Cannot update deployed node blueprint");
      }

      // Update the specification
      const updateData: Partial<NodeBlueprintData> = {
        last_updated_at: new Date()
      };

      if (newCode !== undefined) {
        updateData.user_defined_code_snippet = newCode;
      }

      if (newSpec) {
        if (newSpec.input_sockets) updateData.input_sockets = newSpec.input_sockets;
        if (newSpec.input_socket_order) updateData.input_socket_order = newSpec.input_socket_order;
        if (newSpec.output_sockets) updateData.output_sockets = newSpec.output_sockets;
        if (newSpec.output_socket_order) updateData.output_socket_order = newSpec.output_socket_order;
      }

      await nodeRef.update(updateData);

      logger.info(`Successfully updated node spec: ${nodeId}`);
      return { success: true };
    } catch (error) {
      logger.error("Error updating node spec:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to update node spec");
    }
  },

  // Update node documentation (title and docs)
  updateDocs: async (request: CallableRequest): Promise<{ success: boolean }> => {
    try {
      const authorUid = validateAuth(request);
      const { nodeId, title, docs } = request.data;

      if (!nodeId) {
        throw new HttpsError("invalid-argument", "nodeId is required");
      }

      logger.info(`Updating node docs: ${nodeId} by user: ${authorUid}`);

      // Parse nodeId to get node_key
      const parts = nodeId.split('/');
      if (parts.length < 3) {
        throw new HttpsError("invalid-argument", "Invalid nodeId format");
      }
      const nodeKey = parts[0];

      // Update metadata
      const metadataRef = db.collection(NODES_COLLECTION).doc(nodeKey).collection("metadata").doc("main");
      const updateData: any = {};

      if (title !== undefined) updateData.title = title;
      if (docs !== undefined) updateData.documentation = docs;

      await metadataRef.set(updateData, { merge: true });

      logger.info(`Successfully updated node docs: ${nodeId}`);
      return { success: true };
    } catch (error) {
      logger.error("Error updating node docs:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to update node docs");
    }
  },

  // Deploy a node blueprint (freeze it)
  deploy: async (request: CallableRequest): Promise<{ success: boolean }> => {
    try {
      const authorUid = validateAuth(request);
      const { nodeId } = request.data;

      if (!nodeId) {
        throw new HttpsError("invalid-argument", "nodeId is required");
      }

      logger.info(`Deploying node blueprint: ${nodeId} by user: ${authorUid}`);

      const nodeRef = getNodeRef(nodeId);
      const nodeDoc = await nodeRef.get();

      if (!nodeDoc.exists) {
        throw new HttpsError("not-found", "Node blueprint not found");
      }

      const nodeData = nodeDoc.data() as NodeBlueprintData;

      // Check if user is the creator
      if (nodeData.author_uid !== authorUid) {
        throw new HttpsError("permission-denied", "Only the creator can deploy a node blueprint");
      }

      // Check if already deployed
      if (nodeData.is_deployed) {
        throw new HttpsError("already-exists", "Node blueprint is already deployed");
      }

      // Move to deployed collection
      const deployedData: NodeBlueprintData = {
        ...nodeData,
        is_deployed: true,
        last_updated_at: new Date()
      };

      await getDeployedNodeRef(nodeId).set(deployedData);
      await nodeRef.update({ is_deployed: true });

      logger.info(`Successfully deployed node: ${nodeId}`);
      return { success: true };
    } catch (error) {
      logger.error("Error deploying node:", error);
      throw error instanceof HttpsError ? error : new HttpsError("internal", "Failed to deploy node");
    }
  }
};