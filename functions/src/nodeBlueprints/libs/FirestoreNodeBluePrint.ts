import {
  NodeBluePrint,
  type NodeBluePrintControllerFactoryInterface,
} from "./NodeBluePrint";
import {v4 as uuidv4} from "uuid";
import * as admin from "firebase-admin";
import {FirestoreNodeBluePrintModel} from "../../shared/NodeBluePrintModel";
import {
  InputSocketModel,
  InputSocketParams,
  OutputSocketModel,
  SocketID,
} from "../../shared/SocketModels";
const firestore = admin.firestore();

const NODE_BLUEPRINTS_REF = firestore.collection("nodes");

/**
 * Factory interface for creating FirestoreNodeBluePrint instances.
 */
export class FirestoreNodeBluePrintControllerFactoryInterface
implements NodeBluePrintControllerFactoryInterface {
  /**
   * Creates a new FirestoreNodeBluePrintControllerFactoryInterface.
   */
  constructor() {
    // Empty constructor
  }

  /**
   * Initializes an official node blueprint.
   * @param {string} uniqueFunctionName - The unique function name
   * @return {Promise<NodeBluePrint>} The created node blueprint
   */
  async initOfficialNodeBluePrint(
    uniqueFunctionName: string
  ): Promise<NodeBluePrint> {
    const nid = uniqueFunctionName;
    const authorUid = "official";
    const createdAt = new Date();

    await NODE_BLUEPRINTS_REF.doc(nid).set({
      title: uniqueFunctionName,
      owner: authorUid,
      documentation: "",
      created_at: createdAt,
      last_updated_at: createdAt,
      predecessor_nid: "root",
      is_frozen: false,

      user_defined_code: "",
      input_sockets: {},
      input_socket_order: [],
      output_sockets: {},
      output_socket_order: [],
      input_spec_strict: true,

      trust_level: "Official",
      official_note: "",
      searchable: true,
      tags: ["official"],
    });

    const instance = new NodeBluePrintInFirestore(nid);
    await instance.waitForInitialization();
    return instance;
  }

  /**
   * Initializes a new node blueprint.
   * @param {string} authorUid - The author's UID
   * @param {string} hint - Optional hint for the node title
   * @return {Promise<NodeBluePrint>} The created node blueprint
   */
  async initNewNodeBluePrint(
    authorUid: string,
    hint?: string | undefined
  ): Promise<NodeBluePrint> {
    const nid = `node_custom_${uuidv4()}`;
    const createdAt = new Date();

    await NODE_BLUEPRINTS_REF.doc(nid).set({
      title: hint || "Untitled Node",
      owner: authorUid,
      documentation: "",
      created_at: createdAt,
      last_updated_at: createdAt,
      predecessor_nid: "root",
      is_frozen: false,

      user_defined_code: "",
      input_sockets: {},
      input_socket_order: [],
      output_sockets: {},
      output_socket_order: [],
      input_spec_strict: true,

      trust_level: "New",
      official_note: "",
      searchable: true,
      tags: [],
    });

    const instance = new NodeBluePrintInFirestore(nid);
    await instance.waitForInitialization();
    return instance;
  }

  /**
   * Forks an existing node blueprint.
   * @param {string} nid - The node ID to fork
   * @param {string} authorUid - The author's UID
   * @return {Promise<NodeBluePrint>} The forked node blueprint
   */
  async forkNode(nid: string, authorUid: string): Promise<NodeBluePrint> {
    const newNid = `node_forked_${uuidv4()}`;
    const createdAt = new Date();

    const sourceDoc = await NODE_BLUEPRINTS_REF.doc(nid).get();
    if (!sourceDoc.exists) {
      throw new Error(`Node not found: ${nid}`);
    }

    const data = sourceDoc.data();
    data.title = `Fork of ${data.title}`;
    data.owner = authorUid;
    data.created_at = createdAt;
    data.last_updated_at = createdAt;
    data.is_frozen = false;
    data.predecessor_nid = nid;
    data.trust_level = "New";
    await NODE_BLUEPRINTS_REF.doc(newNid).set(data);

    const instance = new NodeBluePrintInFirestore(newNid);
    await instance.waitForInitialization();
    return instance;
  }
}

/**
 * NodeBluePrint implementation backed by Firestore.
 */
export class NodeBluePrintInFirestore extends NodeBluePrint {
  private current: FirestoreNodeBluePrintModel | undefined;
  readonly nid: string;

  // Firestore subscriptions
  private unsubscribeFirestore: (() => void) | null = null;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Creates a new NodeBluePrintInFirestore instance.
   * @param {string} nid - The node ID
   */
  constructor(nid: string) {
    super();
    this.nid = nid;
    // Note: syncWithFirestore is async, but constructors can't be async
    // The first snapshot will be loaded asynchronously
    this.initializationPromise = this.syncWithFirestore();
  }

  /**
   * Gets the Firestore document reference for this node.
   * @return {admin.firestore.DocumentReference} The document reference
   */
  private getDocRef() {
    return NODE_BLUEPRINTS_REF.doc(this.nid);
  }

  /**
   * Waits for the node to be initialized from Firestore.
   * @return {Promise<void>} Promise that resolves when initialized
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Syncs the node with Firestore and sets up real-time listeners.
   * @return {Promise<void>} Promise that resolves when sync is complete
   */
  private async syncWithFirestore(): Promise<void> {
    // current is solely managed by this. it reflects the data in firestore.
    // NodeBluePrintInFirestore provides access to all derived value, and
    // values of the document
    // NodeBluePrintInFirestore also provides abilities to change these values,
    // but NodeBluePrintInFirestore enforces the way data is stored in the doc
    // all writes are done by updating firestore. the only way to change
    // current is by updating firestore.
    const nodeRef = this.getDocRef();

    // First, get the initial data synchronously
    const initialSnapshot = await nodeRef.get();
    if (initialSnapshot.exists) {
      this.updateCurrentFromSnapshot(initialSnapshot);
    }

    // Then set up the listener for updates
    this.unsubscribeFirestore = nodeRef.onSnapshot((snapshot) => {
      if (!snapshot.exists) {
        throw new Error(
          `NodeBlueprint document not found in Firestore: ${this.nid}`
        );
      }
      this.updateCurrentFromSnapshot(snapshot);
    });
  }

  /**
   * Updates the current state from a Firestore snapshot.
   * @param {admin.firestore.DocumentSnapshot} snapshot - The snapshot
   */
  private updateCurrentFromSnapshot(
    snapshot: admin.firestore.DocumentSnapshot
  ): void {
    const data = snapshot.data();

    const owner = data.owner;

    if (!owner) {
      throw new Error(`NodeBlueprint has no owner: ${this.nid}. Error state.`);
    }

    this.current = {
      title: data.title || "Untitled Operation",
      owner: owner,
      editors: data.editors || [],
      viewers: data.viewers || [],
      documentation: data.documentation || "",
      user_defined_code:
                data.user_defined_code ||
                `console.error("Code not defined in ${this.nid}");`,
      input_sockets: data.input_sockets || {},
      input_socket_order: data.input_socket_order || [],
      output_sockets: data.output_sockets || {},
      output_socket_order: data.output_socket_order || [],
      input_spec_strict: data.input_spec_strict,

      created_at: data.created_at?.toDate() || new Date(),
      predecessor_nid: data.predecessor_nid || "root",
      is_frozen: data.is_frozen as boolean,

      trust_level: data.trust_level || "New",
      official_note: data.official_note || "",
      last_updated_at: data.last_updated_at?.toDate() || new Date(),

      searchable: data.searchable !== undefined ? data.searchable : true,
      tags: data.tags || [],
    } as FirestoreNodeBluePrintModel;
  }

  // Clean up subscriptions
  /**
   * Destroys the node and cleans up listeners.
   */
  destroy() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
  }

  /**
   * Asserts that the node is not frozen.
   * @throws {Error} If the node is frozen
   */
  private assertNotFrozen() {
    if (this.current && this.current.is_frozen) {
      throw new Error(
        `Node is frozen. Cannot be modified. Fork to modify: ${this.nid}`
      );
    }
  }

  /**
     * Update the Firestore document with partial data.
     *
     * ARCHITECTURE NOTE: This method is synchronous to allow setters to throw
     * frozen state errors immediately. However, this creates race conditions
     * because the local state (this.current) is only updated when Firestore
     * pushes changes back through the onSnapshot listener.
     *
     * RACE CONDITIONS:
     * - Multiple rapid calls may read stale local state
     * - Array operations (spread, filter) may lose concurrent changes
     * - Object mutations may conflict with each other
     *
     * MITIGATION: Callers should add delays between operations or implement
     * optimistic local state updates.
     */
  /**
   * Update the Firestore document with partial data.
   * @param {Partial<FirestoreNodeBluePrintModel>} partialData - The data
   */
  protected updateFirestoreDoc(
    partialData: Partial<FirestoreNodeBluePrintModel>
  ): void {
    this.assertNotFrozen();
    if (!this.current) throw new Error("Node not initialized");

    // Perform the async update but don't await it - this enables race
    // conditions but allows synchronous error throwing for frozen state
    this.getDocRef().set(
      {
        ...partialData,
        last_updated_at: new Date(),
      },
      {merge: true}
    ).catch((error) => {
      console.error("Error updating Firestore document:", error);
    });
  }

  /**
   * Updates the last modified timestamp.
   */
  protected update() {
    this.updateFirestoreDoc({});
  }

  // NodeBluePrint implementation
  /**
   * Gets the owner of this node.
   * @return {string} The owner UID
   */
  get owner(): string {
    return this.current.owner;
  }

  /**
   * Sets the owner of this node.
   * @param {string} value - The new owner UID
   */
  set owner(value: string) {
    throw new Error(
      "Not implemented: You cannot change node ownership right now."
    );
  }

  /**
   * Gets the editors of this node.
   * @return {string[]} Array of editor UIDs
   */
  get editors(): string[] {
    return this.current.editors;
  }

  /**
     * Add an editor to this node blueprint.
     *
     * WARNING: Race condition exists when called multiple times rapidly.
     * Each call reads the current state and spreads it, so rapid successive
     * calls may overwrite each other's changes before Firestore updates
     * propagate back.
     * Consider adding delays between calls or implementing optimistic updates.
     */
  /**
   * Add an editor to this node blueprint.
   * @param {string} uid - The editor UID to add
   */
  addEditor(uid: string) {
    // RACE CONDITION: Multiple rapid calls may read the same initial state
    // and overwrite each other's changes
    this.updateFirestoreDoc({
      editors: [...this.current.editors, uid],
    });
  }

  /**
     * Remove an editor from this node blueprint.
     *
     * WARNING: Race condition exists when called multiple times rapidly or
     * mixed with addEditor calls. Reads current state and filters it, so
     * concurrent modifications may be lost.
     */
  /**
   * Remove an editor from this node blueprint.
   * @param {string} uid - The editor UID to remove
   */
  removeEditor(uid: string) {
    // RACE CONDITION: Concurrent add/remove operations may conflict
    const editors = this.current.editors.filter((editorUid) => {
      return editorUid !== uid;
    });

    this.updateFirestoreDoc({
      editors: editors,
    });
  }

  /**
   * Gets the viewers of this node.
   * @return {string[]} Array of viewer UIDs
   */
  get viewers(): string[] {
    return this.current.viewers;
  }

  /**
     * Add a viewer to this node blueprint.
     *
     * WARNING: Race condition exists when called multiple times rapidly.
     * Each call reads the current state and spreads it, so rapid successive
     * calls may overwrite each other's changes before Firestore updates
     * propagate back.
     */
  /**
   * Add a viewer to this node blueprint.
   * @param {string} uid - The viewer UID to add
   */
  addViewer(uid: string): void {
    // RACE CONDITION: Multiple rapid calls may read the same initial state
    // and overwrite each other's changes
    this.updateFirestoreDoc({
      viewers: [...this.current.viewers, uid],
    });
  }

  /**
     * Remove a viewer from this node blueprint.
     *
     * WARNING: Race condition exists when called multiple times rapidly or
     * mixed with addViewer calls. Reads current state and filters it, so
     * concurrent modifications may be lost.
     */
  /**
   * Remove a viewer from this node blueprint.
   * @param {string} uid - The viewer UID to remove
   */
  removeViewer(uid: string) {
    // RACE CONDITION: Concurrent add/remove operations may conflict
    const viewers = this.current.viewers.filter((viewerUid) => {
      return viewerUid !== uid;
    });

    this.updateFirestoreDoc({
      viewers: viewers,
    });
  }

  /**
   * Gets the creation date of this node.
   * @return {Date} The creation date
   */
  get created_at(): Date {
    return this.current?.created_at;
  }

  /**
   * Gets the predecessor node ID.
   * @return {string} The predecessor node ID
   */
  get predecessor_nid(): string {
    return this.current?.predecessor_nid;
  }

  /**
   * Gets the trust level of this node.
   * @return {string} The trust level
   */
  get trust_level(): string {
    return this.current.trust_level;
  }

  /**
   * Sets the trust level of this node.
   * @param {string} value - The new trust level
   */
  set trust_level(value: string) {
    if (value.toLowerCase().trim()==="official") {
      throw new Error("Official is a reserved trust level.");
    }
    this.updateFirestoreDoc({
      trust_level: value.trim(),
    });
  }

  /**
   * Gets the official note for this node.
   * @return {string} The official note
   */
  get official_note(): string {
    return this.current?.official_note;
  }

  // Title and Documentation (stored at metadata level)
  /**
   * Gets the title of this node.
   * @return {string} The title
   */
  get title(): string {
    return this.current.title;
  }

  /**
   * Sets the title of this node.
   * @param {string} title - The new title
   */
  set title(title: string) {
    this.updateFirestoreDoc({
      title: title,
    });
  }

  /**
   * Gets the documentation for this node.
   * @return {string} The documentation
   */
  get documentation(): string {
    return this.current.documentation;
  }

  /**
   * Sets the documentation for this node.
   * @param {string} documentation - The new documentation
   */
  set documentation(documentation: string) {
    this.updateFirestoreDoc({
      documentation: documentation,
    });
  }

  // Code (stored at version level)
  /**
   * Gets the user-defined code for this node.
   * @return {string} The code
   */
  get code(): string {
    return this.current?.user_defined_code;
  }

  /**
   * Sets the user-defined code for this node.
   * @param {string} code - The new code
   */
  set code(code: string) {
    this.updateFirestoreDoc({
      user_defined_code: code,
    });
  }

  // Socket management (stored at version level)
  /**
     * Add a new input socket to this node blueprint.
     *
     * WARNING: Race condition exists when called multiple times rapidly.
     * Modifies the current socket objects directly and may conflict with
     * concurrent socket additions. Consider using immutable updates.
     */
  /**
   * Add a new input socket to this node blueprint.
   * @param {SocketID} socketKey - The socket key
   * @param {InputSocketModel<InputSocketParams>} socket - The socket
   */
  newInputSocket(
    socketKey: SocketID,
    socket: InputSocketModel<InputSocketParams>
  ): void {
    // RACE CONDITION: Direct mutation of current.input_sockets and
    // current.input_socket_order
    // Multiple concurrent calls may interfere with each other
    const currentSockets = this.current.input_sockets;
    currentSockets[socketKey] = socket;
    const currentSocketOrder = this.current.input_socket_order;
    if (!currentSocketOrder.includes(socketKey)) {
      currentSocketOrder.push(socketKey);
    }

    this.updateFirestoreDoc({
      input_sockets: currentSockets,
      input_socket_order: currentSocketOrder,
    });
  }

  /**
   * Gets the input socket order.
   * @return {Array<SocketID>} The socket order
   */
  get inputSocketOrder(): Array<SocketID> {
    return this.current.input_socket_order;
  }

  /**
   * Gets the input sockets.
   * @return {Array<InputSocketModel<InputSocketParams>>} The sockets
   */
  get inputSockets(): Array<InputSocketModel<InputSocketParams>> {
    return this.inputSocketOrder.map(
      (key) => this.current.input_sockets[key]
    );
  }

  /**
     * Add a new output socket to this node blueprint.
     *
     * WARNING: Race condition exists when called multiple times rapidly.
     * Modifies the current socket objects directly and may conflict with
     * concurrent socket additions. Consider using immutable updates.
     */
  /**
   * Add a new output socket to this node blueprint.
   * @param {SocketID} socketKey - The socket key
   * @param {OutputSocketModel} socket - The socket
   */
  newOutputSocket(socketKey: SocketID, socket: OutputSocketModel): void {
    // RACE CONDITION: Direct mutation of current.output_sockets and
    // current.output_socket_order
    // Multiple concurrent calls may interfere with each other
    const currentSockets = this.current.output_sockets;
    currentSockets[socketKey] = socket;
    const currentSocketOrder = this.current.output_socket_order;
    if (!currentSocketOrder.includes(socketKey)) {
      currentSocketOrder.push(socketKey);
    }

    this.updateFirestoreDoc({
      output_sockets: currentSockets,
      output_socket_order: currentSocketOrder,
    });
  }

  /**
   * Gets the output sockets.
   * @return {Array<OutputSocketModel>} The sockets
   */
  get outputSockets(): Array<OutputSocketModel> {
    return this.outputSocketOrder.map(
      (key) => this.current.output_sockets[key]
    );
  }

  // Synchronous version using cached model
  /**
   * Gets the output socket order.
   * @return {Array<SocketID>} The socket order
   */
  get outputSocketOrder(): Array<SocketID> {
    return this.current.output_socket_order;
  }

  /**
   * Gets whether this node is frozen.
   * @return {boolean} True if frozen
   */
  get is_frozen(): boolean {
    return this.current.is_frozen;
  }

  /**
   * Gets the last update date.
   * @return {Date} The last update date
   */
  get last_updated_at(): Date {
    return this.current.last_updated_at;
  }

  /**
   * Freezes this node to prevent further modifications.
   */
  freeze(): void {
    this.updateFirestoreDoc({
      is_frozen: true,
    });
  }

  /**
   * Makes this node searchable.
   */
  isSearchable(): void {
    this.updateFirestoreDoc({
      searchable: true,
    });
  }

  /**
   * Makes this node not searchable.
   */
  notSearchable(): void {
    this.updateFirestoreDoc({
      searchable: false,
    });
  }

  /**
   * Gets whether this node is searchable.
   * @return {boolean} True if searchable
   */
  get searchable(): boolean {
    return this.current.searchable;
  }

  /**
   * Sets whether this node is searchable.
   * @param {boolean} value - True to make searchable
   */
  set searchable(value: boolean) {
    if (value) {
      this.isSearchable();
    } else {
      this.notSearchable();
    }
  }

  /**
   * Gets the tags for this node.
   * @return {string[]} The tags
   */
  get tags(): string[] {
    return this.current.tags;
  }

  /**
   * Sets the tags for this node.
   * @param {string[]} tags - The new tags
   */
  set tags(tags: string[]) {
    this.updateFirestoreDoc({
      tags: tags,
    });
  }

  /**
   * Gets whether input spec is strict.
   * @return {boolean} True if strict
   */
  get input_spec_strict(): boolean {
    return this.current.input_spec_strict;
  }

  /**
   * Sets whether input spec is strict.
   * @param {boolean} value - True for strict
   */
  set input_spec_strict(value: boolean) {
    this.updateFirestoreDoc({
      input_spec_strict: value,
    });
  }
}
