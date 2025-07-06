import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  embedNodeBluePrint as embedNodeBluePrintCore,
  embedAllUnembeddedNodeBluePrints as embedAllUnembeddedCore,
  searchNodeBluePrints as searchNodeBluePrintsCore,
} from "./search";
import {
  generateStandardNodeSuite as
  generateStandardNodeSuiteCore,
} from "./libs/FirestoreStandardNodeSet";

// Export the callable functions with authentication checks
export const embedNodeBluePrint = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const {nid} = request.data;
    if (!nid) {
      throw new HttpsError(
        "invalid-argument",
        "NodeBluePrint ID (nid) is required");
    }

    try {
      await embedNodeBluePrintCore(nid);
      return {success: true, nid};
    } catch (error) {
      // Convert regular errors to HttpsError to preserve error messages
      if (error instanceof Error) {
        throw new HttpsError("internal", error.message);
      }
      throw error;
    }
  }
);

export const embedAllUnembeddedNodeBluePrints = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    try {
      return await embedAllUnembeddedCore();
    } catch (error) {
      // Convert regular errors to HttpsError to preserve error messages
      if (error instanceof Error) {
        throw new HttpsError("internal", error.message);
      }
      throw error;
    }
  }
);

export const searchNodeBluePrints = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const {query, limit, trustLevelFilter, tagFilter} = request.data;
    if (!query) {
      throw new HttpsError("invalid-argument", "Search query is required");
    }

    try {
      return await searchNodeBluePrintsCore({
        query,
        limit,
        trustLevelFilter,
        tagFilter,
      });
    } catch (error) {
      // Convert regular errors to HttpsError to preserve error messages
      if (error instanceof Error) {
        throw new HttpsError("internal", error.message);
      }
      throw error;
    }
  }
);

export const generateStandardNodeSuite = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    try {
      await generateStandardNodeSuiteCore();
      await embedAllUnembeddedCore();
      return {
        success: true,
        message: "Standard node suite generated & embedded successfully",
      };
    } catch (error) {
      // Convert regular errors to HttpsError to preserve error messages
      if (error instanceof Error) {
        throw new HttpsError("internal", error.message);
      }
      throw error;
    }
  }
);
