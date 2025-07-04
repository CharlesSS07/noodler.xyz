import {
    NodeBluePrint,
    type NodeBluePrintControllerFactoryInterface,
} from './NodeBluePrint';
import { v4 as uuidv4 } from 'uuid';
import type {
    InputSocketModel,
    InputSocketParams,
    OutputSocketModel,
    SocketID,
} from './SocketModels';
import * as admin from "firebase-admin";
const firestore = admin.firestore();

export interface FirestoreNodeBluePrintModel {
    title: string;
    owner: string;
    editors: string[];
    viewers: string[];
    documentation: string;
    created_at: Date;
    last_updated_at: Date;
    predecessor_nid: string;
    is_frozen: boolean;

    user_defined_code: string;
    input_sockets: Record<string, InputSocketModel<InputSocketParams>>;
    input_socket_order: Array<SocketID>;
    input_spec_strict: boolean;
    output_sockets: Record<string, OutputSocketModel>;
    output_socket_order: Array<string>;

    trust_level: string;
    official_note: string;
    searchable: boolean;
    tags: string[];
}

const NODE_BLUEPRINTS_REF = firestore.collection('nodes');

export class FirestoreNodeBluePrintControllerFactoryInterface
    implements NodeBluePrintControllerFactoryInterface
{
    constructor() {}

    async initOfficialNodeBluePrint(
        uniqueFunctionName: string
    ): Promise<NodeBluePrint> {
        const nid = uniqueFunctionName;
        const authorUid = 'official';
        const createdAt = new Date();

        await NODE_BLUEPRINTS_REF.doc(nid).set({
            title: uniqueFunctionName,
            owner: authorUid,
            documentation: '',
            created_at: createdAt,
            last_updated_at: createdAt,
            predecessor_nid: 'root',
            is_frozen: false,

            user_defined_code: '',
            input_sockets: {},
            input_socket_order: [],
            output_sockets: {},
            output_socket_order: [],
            input_spec_strict: true,

            trust_level: 'Official',
            official_note: '',
            searchable: true,
            tags: ['official'],
        });

        const instance = new NodeBluePrintInFirestore(nid);
        await instance.waitForInitialization();
        return instance;
    }

    async initNewNodeBluePrint(
        author_uid: string,
        hint?: string | undefined
    ): Promise<NodeBluePrint> {
        const nid = `node_custom_${uuidv4()}`;
        const createdAt = new Date();

        await NODE_BLUEPRINTS_REF.doc(nid).set({
            title: hint || 'Untitled Node',
            owner: author_uid,
            documentation: '',
            created_at: createdAt,
            last_updated_at: createdAt,
            predecessor_nid: 'root',
            is_frozen: false,

            user_defined_code: '',
            input_sockets: {},
            input_socket_order: [],
            output_sockets: {},
            output_socket_order: [],
            input_spec_strict: true,

            trust_level: 'New',
            official_note: '',
            searchable: true,
            tags: [],
        });

        const instance = new NodeBluePrintInFirestore(nid);
        await instance.waitForInitialization();
        return instance;
    }

    async forkNode(nid: string, author_uid: string): Promise<NodeBluePrint> {
        const newNid = `node_forked_${uuidv4()}`;
        const createdAt = new Date();

        const sourceDoc = await NODE_BLUEPRINTS_REF.doc(nid).get();
        if (!sourceDoc.exists) {
            throw new Error(`Node not found: ${nid}`);
        }

        const data = sourceDoc.data();
        data.title = `Fork of ${data.title}`;
        data.owner = author_uid;
        data.created_at = createdAt;
        data.last_updated_at = createdAt;
        data.is_frozen = false;
        data.predecessor_nid = nid;
        data.trust_level = 'New';
        await NODE_BLUEPRINTS_REF.doc(newNid).set(data);

        const instance = new NodeBluePrintInFirestore(newNid);
        await instance.waitForInitialization();
        return instance;
    }
}

export class NodeBluePrintInFirestore extends NodeBluePrint {
    private current: FirestoreNodeBluePrintModel | undefined;
    readonly nid: string;

    // Firestore subscriptions
    private unsubscribeFirestore: (() => void) | null = null;
    private initializationPromise: Promise<void> | null = null;

    constructor(nid: string) {
        super();
        this.nid = nid;
        // Note: syncWithFirestore is async, but constructors can't be async
        // The first snapshot will be loaded asynchronously
        this.initializationPromise = this.syncWithFirestore();
    }

    private getDocRef() {
        return NODE_BLUEPRINTS_REF.doc(this.nid);
    }
    
    async waitForInitialization(): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    private async syncWithFirestore(): Promise<void> {
        // current is soley managed by this. it reflects the data in firestore.
        // NodeBluePrintInFirestore provides access to all derived value, and values of the document
        // NodeBluePrintInFirestore also provides abilities to change these values,
        // but NodeBluePrintInFirestore enforces the way data is stored in the doc
        // all writes are done by updating firestore. the only way to change current is by updating firestore.
        const nodeRef = this.getDocRef();
        
        // First, get the initial data synchronously
        const initialSnapshot = await nodeRef.get();
        if (initialSnapshot.exists) {
            this.updateCurrentFromSnapshot(initialSnapshot);
        }
        
        // Then set up the listener for updates
        this.unsubscribeFirestore = nodeRef.onSnapshot(snapshot => {
            if (!snapshot.exists) {
                throw new Error(
                    `NodeBlueprint document not found in Firestore: ${this.nid}`
                );
            }
            this.updateCurrentFromSnapshot(snapshot);
        });
    }
    
    private updateCurrentFromSnapshot(snapshot: admin.firestore.DocumentSnapshot): void {
        const data = snapshot.data();

        const owner = data.owner;

        if (!owner) {
            throw new Error(`NodeBlueprint has no owner: ${this.nid}. Error state.`);
        }

        this.current = {
            title: data.title || 'Untitled Operation',
            owner: owner,
            editors: data.editors || [],
            viewers: data.viewers || [],
            documentation: data.documentation || '',
            user_defined_code:
                data.user_defined_code ||
                `console.error("Code not defined in ${this.nid}");`,
            input_sockets: data.input_sockets || {},
            input_socket_order: data.input_socket_order || [],
            output_sockets: data.output_sockets || {},
            output_socket_order: data.output_socket_order || [],
            input_spec_strict: data.input_spec_strict,

            created_at: data.created_at?.toDate() || new Date(),
            predecessor_nid: data.predecessor_nid || 'root',
            is_frozen: data.is_frozen as boolean,

            trust_level: data.trust_level || 'New',
            official_note: data.official_note || '',
            last_updated_at: data.last_updated_at?.toDate() || new Date(),

            searchable: data.searchable !== undefined ? data.searchable : true,
            tags: data.tags || [],
        } as FirestoreNodeBluePrintModel;
    }

    // Clean up subscriptions
    destroy() {
        if (this.unsubscribeFirestore) {
            this.unsubscribeFirestore();
            this.unsubscribeFirestore = null;
        }
    }

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
    protected updateFirestoreDoc(partialData: Partial<FirestoreNodeBluePrintModel>): void {
        this.assertNotFrozen();
        if (!this.current) throw new Error('Node not initialized');
        
        // Perform the async update but don't await it - this enables race conditions
        // but allows synchronous error throwing for frozen state
        this.getDocRef().set(
            {
                ...partialData,
                last_updated_at: new Date()
            },
            {merge: true}
        ).catch(error => {
            console.error('Error updating Firestore document:', error);
        });
    }

    protected update() {
        this.updateFirestoreDoc({});
    }

    // NodeBluePrint implementation
    get owner(): string {
        return this.current.owner;
    }

    set owner(value: string) {
        throw new Error("Not implemented: You cannot change node ownership right now.");
    }

    get editors(): string[] {
        return this.current.editors;
    }

    /**
     * Add an editor to this node blueprint.
     * 
     * WARNING: Race condition exists when called multiple times rapidly.
     * Each call reads the current state and spreads it, so rapid successive calls
     * may overwrite each other's changes before Firestore updates propagate back.
     * Consider adding delays between calls or implementing optimistic updates.
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
    removeEditor(uid: string) {
        // RACE CONDITION: Concurrent add/remove operations may conflict
        const editors = this.current.editors.filter((editor_uid) => {
            return editor_uid !== uid;
        });

        this.updateFirestoreDoc({
            editors: editors,
        });
    }

    get viewers(): string[] {
        return this.current.viewers;
    }

    /**
     * Add a viewer to this node blueprint.
     * 
     * WARNING: Race condition exists when called multiple times rapidly.
     * Each call reads the current state and spreads it, so rapid successive calls
     * may overwrite each other's changes before Firestore updates propagate back.
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
    removeViewer(uid: string) {
        // RACE CONDITION: Concurrent add/remove operations may conflict
        const viewers = this.current.viewers.filter((viewer_uid) => {
            return viewer_uid !== uid;
        });

        this.updateFirestoreDoc({
            viewers: viewers,
        });
    }

    get created_at(): Date {
        return this.current?.created_at;
    }

    get predecessor_nid(): string {
        return this.current?.predecessor_nid;
    }

    get trust_level(): string {
        return this.current.trust_level;
    }

    set trust_level(value: string) {
        if (value.toLowerCase().trim()==='official') {
            throw new Error("Official is a reserved trust level.")
        }
        this.updateFirestoreDoc({
            trust_level: value.trim(),
        });
    }

    get official_note(): string {
        return this.current?.official_note;
    }

    // Title and Documentation (stored at metadata level)
    get title(): string {
        return this.current.title;
    }

    set title(title: string) {
        this.updateFirestoreDoc({
            title: title,
        });
    }

    get documentation(): string {
        return this.current.documentation;
    }

    set documentation(documentation: string) {
        this.updateFirestoreDoc({
            documentation: documentation,
        })
    }

    // Code (stored at version level)
    get code(): string {
        return this.current?.user_defined_code;
    }

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
    newInputSocket(
        socket_key: SocketID,
        socket: InputSocketModel<InputSocketParams>
    ): void {
        // RACE CONDITION: Direct mutation of current.input_sockets and current.input_socket_order
        // Multiple concurrent calls may interfere with each other
        const currentSockets = this.current.input_sockets;
        currentSockets[socket_key] = socket;
        const currentSocketOrder = this.current.input_socket_order;
        if (!currentSocketOrder.includes(socket_key)) {
            currentSocketOrder.push(socket_key);
        }

        this.updateFirestoreDoc({
            input_sockets: currentSockets,
            input_socket_order: currentSocketOrder
        });
    }

    get inputSocketOrder(): Array<SocketID> {
        return this.current.input_socket_order;
    }

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
    newOutputSocket(socket_key: SocketID, socket: OutputSocketModel): void {
        // RACE CONDITION: Direct mutation of current.output_sockets and current.output_socket_order
        // Multiple concurrent calls may interfere with each other
        const currentSockets = this.current.output_sockets;
        currentSockets[socket_key] = socket;
        const currentSocketOrder = this.current.output_socket_order;
        if (!currentSocketOrder.includes(socket_key)) {
            currentSocketOrder.push(socket_key);
        }

        this.updateFirestoreDoc({
            output_sockets: currentSockets,
            output_socket_order: currentSocketOrder
        });
    }

    get outputSockets(): Array<OutputSocketModel> {
        return this.outputSocketOrder.map(
            (key) => this.current.output_sockets[key]
        );
    }

    // Synchronous version using cached model
    get outputSocketOrder(): Array<SocketID> {
        return this.current.output_socket_order;
    }

    get is_frozen(): boolean {
        return this.current.is_frozen;
    }

    get last_updated_at(): Date {
        return this.current.last_updated_at;
    }

    freeze(): void {
        this.updateFirestoreDoc({
            is_frozen: true
        });
    }

    isSearchable(): void {
        this.updateFirestoreDoc({
            searchable: true
        });
    }

    notSearchable(): void {
        this.updateFirestoreDoc({
            searchable: false
        });
    }

    get searchable(): boolean {
        return this.current.searchable;
    }

    set searchable(value: boolean) {
        if (value) {
            this.isSearchable();
        } else {
            this.notSearchable();
        }
    }

    get tags(): string[] {
        return this.current.tags;
    }

    set tags(tags: string[]) {
        this.updateFirestoreDoc({
            tags: tags
        });
    }

    get input_spec_strict(): boolean {
        return this.current.input_spec_strict;
    }

    set input_spec_strict(value: boolean) {
        this.updateFirestoreDoc({
            input_spec_strict: value
        });
    }
}
