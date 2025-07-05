import {NodeBluePrint} from "./libs/NodeBluePrint";
import * as admin from "firebase-admin";
import {
  FirestoreNodeBluePrintModel,
} from "$shared/NodeBluePrintModel";
const firestore = admin.firestore();

/**
 * Retrieves a node blueprint from Firestore by node ID.
 * @param {string} nid - The node ID to retrieve
 * @return {Promise<NodeBluePrint>} The node blueprint data
 */
async function getNodeBluePrint(nid: string) {
  try {
    const nbpRef = await firestore
      .collection("nodes")
      .doc(nid).get();
    if (!nbpRef.exists) {
      throw new Error(`No such nid exists: ${nid}.`);
    }
    const nbpData = nbpRef.data();
    return nbpData as NodeBluePrint;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Updates a node blueprint with the provided partial data.
 * @param {string} nid - The node ID to update
 * @param {Partial<FirestoreNodeBluePrintModel>} nodeBlueprint - Partial data
 * @return {Promise<void>} Promise that resolves when update is complete
 */
export async function updateNodeBlueprint(
  nid: string,
  nodeBlueprint: Partial<FirestoreNodeBluePrintModel>
): Promise<void> {
  const nbp = await getNodeBluePrint(nid);

  if (nbp.is_frozen) {
    throw new Error(
      `This node is frozen: ${nid}. Cannot change a frozen node.`
    );
  }

  /**
   * Checks if new value exists and is different from old value.
   * @param {unknown} newValue - The new value to compare
   * @param {unknown} oldValue - The old value to compare
   * @return {boolean} True if values are different
   */
  function existsAndNotEqual(newValue: unknown, oldValue: unknown): boolean {
    return newValue !== undefined &&
      JSON.stringify(newValue) !== JSON.stringify(oldValue);
  }

  // Owner (note: ownership changes are not allowed)
  if (existsAndNotEqual(nodeBlueprint.owner, nbp.owner)) {
    throw new Error(
      "Not implemented: You cannot change node ownership right now."
    );
  }

  // Title
  if (existsAndNotEqual(nodeBlueprint.title, nbp.title)) {
    nbp.title = nodeBlueprint.title;
  }

  // Documentation
  if (existsAndNotEqual(nodeBlueprint.documentation, nbp.documentation)) {
    nbp.documentation = nodeBlueprint.documentation;
  }

  // Code
  if (existsAndNotEqual(nodeBlueprint.user_defined_code, nbp.code)) {
    nbp.code = nodeBlueprint.user_defined_code;
  }

  // Trust level
  if (existsAndNotEqual(nodeBlueprint.trust_level, nbp.trust_level)) {
    nbp.trust_level = nodeBlueprint.trust_level;
  }

  // Official note (read-only property, but we can check if it exists)
  if (nodeBlueprint.official_note !== undefined &&
      nodeBlueprint.official_note !== nbp.official_note) {
    throw new Error("Official note cannot be modified directly.");
  }

  // Searchable
  if (existsAndNotEqual(nodeBlueprint.searchable, nbp.searchable)) {
    nbp.searchable = nodeBlueprint.searchable;
  }

  // Input spec strict
  if (existsAndNotEqual(
    nodeBlueprint.input_spec_strict,
    nbp.input_spec_strict
  )) {
    nbp.input_spec_strict = nodeBlueprint.input_spec_strict;
  }

  // Tags
  if (existsAndNotEqual(nodeBlueprint.tags, nbp.tags)) {
    nbp.tags = nodeBlueprint.tags;
  }

  // Frozen state (can only be set to true, not false)
  if (nodeBlueprint.is_frozen && !nbp.is_frozen) {
    nbp.freeze();
  }

  // Editors array
  if (existsAndNotEqual(nodeBlueprint.editors, nbp.editors)) {
    // Clear existing editors and add new ones
    const currentEditors = [...nbp.editors];
    for (const editor of currentEditors) {
      nbp.removeEditor(editor);
    }
    for (const editor of nodeBlueprint.editors) {
      nbp.addEditor(editor);
    }
  }

  // Viewers array
  if (existsAndNotEqual(nodeBlueprint.viewers, nbp.viewers)) {
    // Clear existing viewers and add new ones
    const currentViewers = [...nbp.viewers];
    for (const viewer of currentViewers) {
      nbp.removeViewer(viewer);
    }
    for (const viewer of nodeBlueprint.viewers) {
      nbp.addViewer(viewer);
    }
  }

  // Socket management (input_sockets, output_sockets, socket orders)
  if (existsAndNotEqual(nodeBlueprint.input_sockets, nbp.inputSockets)) {
    // Note: This is complex as it requires comparing socket objects
    // For now, we'll assume the caller handles socket updates separately
    console.warn(
      "Input socket updates should be handled via newInputSocket method"
    );
  }

  if (existsAndNotEqual(nodeBlueprint.output_sockets, nbp.outputSockets)) {
    // Note: This is complex as it requires comparing socket objects
    // For now, we'll assume the caller handles socket updates separately
    console.warn(
      "Output socket updates should be handled via newOutputSocket method"
    );
  }

  return;
}
