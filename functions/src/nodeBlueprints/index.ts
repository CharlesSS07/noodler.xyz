import {onCall} from "firebase-functions/v2/https";
import {
  embedNodeBluePrint as embedNodeBluePrintCore,
  embedAllUnembeddedNodeBluePrints as embedAllUnembeddedCore,
  searchNodeBluePrints as searchNodeBluePrintsCore,
} from "./search";
import {
  generateStandardNodeSuite as generateStandardNodeSuiteCore,
} from "./libs/FirestoreStandardNodeSet";

// Export the callable functions with authentication checks
export const embedNodeBluePrint = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new Error("Authentication required");
    }

    const {nid} = request.data;
    if (!nid) {
      throw new Error("NodeBluePrint ID (nid) is required");
    }

    await embedNodeBluePrintCore(nid);
    return {success: true, nid};
  }
);

export const embedAllUnembeddedNodeBluePrints = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new Error("Authentication required");
    }

    return await embedAllUnembeddedCore();
  }
);

export const searchNodeBluePrints = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new Error("Authentication required");
    }

    const {query, limit, trustLevelFilter, tagFilter} = request.data;
    if (!query) {
      throw new Error("Search query is required");
    }

    return await searchNodeBluePrintsCore({
      query,
      limit,
      trustLevelFilter,
      tagFilter,
    });
  }
);

export const generateStandardNodeSuite = onCall(
  async (request) => {
    // Check authentication
    if (!request.auth?.uid) {
      throw new Error("Authentication required");
    }

    await generateStandardNodeSuiteCore();
    await embedAllUnembeddedCore();
    return {
      success: true,
      message: "Standard node suite generated & embedded successfully",
    };
  }
);
