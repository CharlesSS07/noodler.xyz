import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    increment,
    setDoc,
    updateDoc,
    onSnapshot,
    type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import type {
    NodeBluePrintControllerFactoryInterface,
} from './NodeBluePrint.js';
import { NodeBluePrint } from './NodeBluePrint.js';
import { v4 as uuidv4 } from 'uuid';
import type {
    InputSocketModel,
    InputSocketParams,
    OutputSocketModel,
    SocketID,
} from './SocketModels';
import type { OutputSocketAsyncReturner } from './Interpreter';

const nodeBluePrintsRef = collection(firestore, 'nodes');

export class FirestoreNodeBluePrintControllerFactoryInterface
    implements NodeBluePrintControllerFactoryInterface
{
    constructor() {}

    async initOfficialNodeBluePrint(
        uniqueFunctionName: string
    ): Promise<FirestoreNodeBluePrintController> {
        const nodeKey = `official_node_${uniqueFunctionName}`;
        const authorUid = 'official';
        const createdAt = new Date();

        const nodeBluePrintController = new FirestoreNodeBluePrintController(nodeKey, authorUid, createdAt);
        
        // Set the initial metadata
        nodeBluePrintController.title = 'Untitled Operation';
        nodeBluePrintController.documentation = '';

        // Set version-specific data
        const versionData = {
            author_uid: authorUid,
            created_at: createdAt,
            predecessor_nid: 'root',
            trust_level: 'Official',
            official_note: '',
            input_sockets: {},
            input_socket_order: [],
            output_sockets: {},
            output_socket_order: [],
            user_defined_code_snippet: 'console.log("Hello World");',
            last_updated_at: createdAt
        };

        await setDoc(nodeBluePrintController.getVersionRef(), versionData);

        console.log(`STD lib node saved: ${uniqueFunctionName}`);

        return nodeBluePrintController;
    }

    async initNewNodeBluePrint(
        author_uid: string,
        hint?: string | undefined
    ): Promise<FirestoreNodeBluePrintController> {
        const nodeKey = `node_${hint || 'custom'}_${uuidv4()}`;
        const createdAt = new Date();

        const nodeBluePrintController = new FirestoreNodeBluePrintController(nodeKey, author_uid, createdAt);
        
        // Set the initial metadata
        nodeBluePrintController.title = 'Untitled Operation';
        nodeBluePrintController.documentation = '';

        // Set version-specific data
        const versionData = {
            author_uid: author_uid,
            created_at: createdAt,
            predecessor_nid: 'root',
            trust_level: 'New',
            official_note: '',
            input_sockets: {},
            input_socket_order: [],
            output_sockets: {},
            output_socket_order: [],
            user_defined_code_snippet: 'console.log("Hello World");',
            last_updated_at: createdAt
        };

        await setDoc(nodeBluePrintController.getVersionRef(), versionData);

        console.log(`Created new Op: Untitled Operation`);

        return nodeBluePrintController;
    }
}
export class FirestoreNodeBluePrintController extends NodeBluePrint {
    private _predecessor_nid: string;
    private _trust_level: string;
    private _official_note: string;
    
    // Internal reactive model
    private _metadataModel: {
        title: string;
        documentation: string;
    } = {
        title: 'Untitled Operation',
        documentation: ''
    };
    
    private _versionModel: {
        user_defined_code_snippet: string;
        input_sockets: Record<string, InputSocketModel<InputSocketParams>>;
        input_socket_order: Array<SocketID>;
        output_sockets: Record<string, OutputSocketModel>;
        output_socket_order: Array<string>;
        author_uid: string;
        created_at: Date;
        predecessor_nid: string;
        trust_level: string;
        official_note: string;
        last_updated_at: Date;
    } = {
        user_defined_code_snippet: 'console.log("Hello World");',
        input_sockets: {},
        input_socket_order: [],
        output_sockets: {},
        output_socket_order: [],
        author_uid: '',
        created_at: new Date(),
        predecessor_nid: 'root',
        trust_level: 'New',
        official_note: '',
        last_updated_at: new Date()
    };
    
    // Firestore subscriptions
    private _metadataUnsubscribe: Unsubscribe | null = null;
    private _versionUnsubscribe: Unsubscribe | null = null;
    
    constructor(node_key: string, author_uid: string, created_at: Date) {
        super(node_key, author_uid, created_at);
        this._predecessor_nid = 'root';
        this._trust_level = 'New';
        this._official_note = '';
        
        // Update version model with constructor values
        this._versionModel.author_uid = this._author_uid;
        this._versionModel.created_at = this._created_at;
        this._versionModel.predecessor_nid = this._predecessor_nid;
        this._versionModel.trust_level = this._trust_level;
        this._versionModel.official_note = this._official_note;
        
        // Initialize reactive subscriptions
        this._initializeSubscriptions();
    }
    
    private _initializeSubscriptions() {
        // Subscribe to metadata changes
        this._metadataUnsubscribe = onSnapshot(this.getMetadataRef(), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                this._metadataModel.title = data.title || 'Untitled Operation';
                this._metadataModel.documentation = data.documentation || '';
            }
        });
        
        // Subscribe to version changes
        this._versionUnsubscribe = onSnapshot(this.getVersionRef(), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                this._versionModel = {
                    user_defined_code_snippet: data.user_defined_code_snippet || 'console.log("Hello World");',
                    input_sockets: data.input_sockets || {},
                    input_socket_order: data.input_socket_order || [],
                    output_sockets: data.output_sockets || {},
                    output_socket_order: data.output_socket_order || [],
                    author_uid: data.author_uid || '',
                    created_at: data.created_at?.toDate() || new Date(),
                    predecessor_nid: data.predecessor_nid || 'root',
                    trust_level: data.trust_level || 'New',
                    official_note: data.official_note || '',
                    last_updated_at: data.last_updated_at?.toDate() || new Date()
                };
            }
        });
    }
    
    // Clean up subscriptions
    destroy() {
        if (this._metadataUnsubscribe) {
            this._metadataUnsubscribe();
            this._metadataUnsubscribe = null;
        }
        if (this._versionUnsubscribe) {
            this._versionUnsubscribe();
            this._versionUnsubscribe = null;
        }
    }

    // NodeBluePrint implementation
    get author_uid(): string {
        return this._author_uid;
    }

    set author_uid(author_uid: string) {
        this._author_uid = author_uid;
    }

    get node_key(): string {
        return this._node_key;
    }

    set node_key(node_key: string) {
        this._node_key = node_key;
    }

    get created_at(): Date {
        return this._created_at;
    }

    set created_at(date: Date) {
        this._created_at = date;
    }

    get predecessor_nid(): string {
        return this._predecessor_nid;
    }

    get trust_level(): string {
        return this._trust_level;
    }

    set trust_level(trust_level: string) {
        this._trust_level = trust_level;
    }

    get official_note(): string {
        return this._official_note;
    }

    set official_note(note: string) {
        this._official_note = note;
    }

    // Storage reference methods
    getVersionRef() {
        return doc(nodeBluePrintsRef, this.nid);
    }

    private getMetadataRef() {
        // Use subcollection: nodes/{node_key}/metadata/main
        return doc(collection(doc(nodeBluePrintsRef, this.node_key), 'metadata'), 'main');
    }

    private getNodeBaseRef() {
        return doc(nodeBluePrintsRef, this.node_key);
    }

    // Title and Documentation (stored at metadata level)
    get title(): string {
        return this._metadataModel.title;
    }

    set title(title: string) {
        this._metadataModel.title = title;
        // Update Firestore reactively
        setDoc(this.getMetadataRef(), { title }, { merge: true });
    }

    get documentation(): string {
        return this._metadataModel.documentation;
    }

    set documentation(documentation: string) {
        this._metadataModel.documentation = documentation;
        // Update Firestore reactively
        setDoc(this.getMetadataRef(), { documentation }, { merge: true });
    }

    // Code (stored at version level)
    get code(): string {
        return this._versionModel.user_defined_code_snippet;
    }

    set code(code: string) {
        this._versionModel.user_defined_code_snippet = code;
        this._versionModel.last_updated_at = new Date();
        // Update Firestore reactively
        this._updateVersionInFirestore();
    }

    private async _updateVersionInFirestore(): Promise<void> {
        const versionData = {
            user_defined_code_snippet: this._versionModel.user_defined_code_snippet,
            input_sockets: this._versionModel.input_sockets,
            input_socket_order: this._versionModel.input_socket_order,
            output_sockets: this._versionModel.output_sockets,
            output_socket_order: this._versionModel.output_socket_order,
            author_uid: this._versionModel.author_uid,
            created_at: this._versionModel.created_at,
            predecessor_nid: this._versionModel.predecessor_nid,
            trust_level: this._versionModel.trust_level,
            official_note: this._versionModel.official_note,
            last_updated_at: this._versionModel.last_updated_at
        };
        await setDoc(this.getVersionRef(), versionData);
    }

    // Socket management (stored at version level)
    async newInputSocket(socket_key: SocketID, socket: InputSocketModel<InputSocketParams>): Promise<void> {
        // Update local model
        this._versionModel.input_sockets[socket_key] = socket;
        if (!this._versionModel.input_socket_order.includes(socket_key)) {
            this._versionModel.input_socket_order.push(socket_key);
        }
        this._versionModel.last_updated_at = new Date();
        
        // Update Firestore
        await this._updateVersionInFirestore();
    }

    get inputSocketKeys(): Array<SocketID> {
        return this._versionModel.input_socket_order;
    }

    get inputSockets(): Array<InputSocketModel<InputSocketParams>> {
        return this._versionModel.input_socket_order.map(key => this._versionModel.input_sockets[key]).filter(Boolean);
    }

    async newOutputSocket(socket_key: SocketID, socket: OutputSocketModel): Promise<void> {
        // Update local model
        this._versionModel.output_sockets[socket_key] = socket;
        if (!this._versionModel.output_socket_order.includes(socket_key)) {
            this._versionModel.output_socket_order.push(socket_key);
        }
        this._versionModel.last_updated_at = new Date();
        
        // Update Firestore
        await this._updateVersionInFirestore();
    }

    get outputSockets(): Array<OutputSocketModel> {
        return this._versionModel.output_socket_order.map(key => this._versionModel.output_sockets[key]).filter(Boolean);
    }

    // Synchronous version using cached model
    async outputSocketKeys(): Promise<string[]> {
        return this._versionModel.output_socket_order;
    }

    // Spin off functionality
    async spinOffNode(author_uid: string): Promise<NodeBluePrint> {
        // Create new nid with new timestamp
        const newCreatedAt = new Date();
        const newController = new FirestoreNodeBluePrintController(this.node_key, author_uid, newCreatedAt);

        // Copy metadata (title and documentation)
        newController.title = `Spinnoff of ${this.title}`;
        newController.documentation = this.documentation;

        // Copy version data with updated trust level and predecessor
        const spinnoffData = {
            ...this._versionModel,
            author_uid,
            created_at: newCreatedAt,
            predecessor_nid: this.nid,
            trust_level: 'New', // Reduce trust level for spinnoffs
            last_updated_at: newCreatedAt
        };

        await setDoc(newController.getVersionRef(), spinnoffData);

        return newController;
    }

    // Execution
    async call(inputs: Record<string, unknown>, outputs: OutputSocketAsyncReturner): Promise<void> {
        try {
            const code = this._versionModel.user_defined_code_snippet;

            if (!code || code.trim() === '') {
                throw new Error(`No code defined for node: ${this.nid}`);
            }

            // Create execution context
            const executionContext = {
                inputs,
                outputs,
                utils: {
                    // Add utility functions that nodes might need
                    Jimp: (globalThis as any).Jimp || null,
                    APIConnectionManager: (globalThis as any).APIConnectionManager || null,
                },
                console: console
            };

            // Create async function from the code
            const asyncFunction = new Function(
                'inputs',
                'outputs',
                'utils',
                'console',
                `return (async function() {
    ${code}
})();`
            );

            // Execute the code with the context
            await asyncFunction(
                executionContext.inputs,
                executionContext.outputs,
                executionContext.utils,
                executionContext.console
            );

        } catch (error) {
            console.error(`Error executing node ${this.nid}:`, error);
            throw new Error(`Node execution failed: ${error.message}`);
        }
    }
}
