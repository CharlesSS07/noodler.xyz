import {collection, doc, getDoc, onSnapshot, setDoc, type Unsubscribe,} from 'firebase/firestore';
import {firestore} from '../../../firebase';
import {NodeBluePrint, type NodeBluePrintControllerFactoryInterface,} from './NodeBluePrint.js';
import {v4 as uuidv4} from 'uuid';
import type {InputSocketModel, InputSocketParams, OutputSocketModel, SocketID,} from './SocketModels';
import {OutputSocketAsyncReturner} from './Interpreter';
import {Jimp} from "jimp";
import {NodeAPIConnectorManager} from "./NodeAPIConnector/NodeAPIConnectorManager";

export interface FirestoreNodeBluePrintModel {
    title: string;
    author_uid: string;
    documentation: string;
    created_at: Date;
    last_updated_at: Date;
    predecessor_nid: string;
    is_frozen: boolean;

    user_defined_code: string;
    input_sockets: Record<string, InputSocketModel<InputSocketParams>>;
    input_socket_order: Array<SocketID>;
    output_sockets: Record<string, OutputSocketModel>;
    output_socket_order: Array<string>;

    trust_level: string;
    official_note: string;
}

export const DEFAULT_FIRESTORE_NODE_BLUEPRINT_MODEL = {
    title: "Uninitialized Node",
    author_uid: "anonymous",
    documentation: "",
    created_at: new Date(),
    last_updated_at: new Date(),
    predecessor_nid: "none",
    is_frozen: true,

    user_defined_code: 'throw Error("DefaultFirestoreNodeBluePrintModel: Node code is not yet loaded!");',
    input_sockets: { },
    input_socket_order: [],
    output_sockets: {},
    output_socket_order: [],

    trust_level: 'Uninitialized',
    official_note: 'This node was not set up properly.',
} as FirestoreNodeBluePrintModel;

const NODE_BLUEPRINTS_REF = collection(firestore, 'nodes');

export class FirestoreNodeBluePrintControllerFactoryInterface
    implements NodeBluePrintControllerFactoryInterface
{
    constructor() {}

    async initOfficialNodeBluePrint(
        uniqueFunctionName: string
    ): Promise<NodeBluePrint> {
        const nid = `node_official_${uniqueFunctionName}`;
        const authorUid = 'official';
        const createdAt = new Date();

        await setDoc(doc(NODE_BLUEPRINTS_REF, nid), {
            title: uniqueFunctionName,
            author_uid: authorUid,
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

            trust_level: 'Official',
            official_note: '',
        })

        return await this.getNodeBluePrintFromNID(nid);
    }

    async initNewNodeBluePrint(
        author_uid: string,
        hint?: string | undefined
    ): Promise<NodeBluePrint> {
        const nid = `node_custom_${uuidv4()}`;
        const createdAt = new Date();

        await setDoc(doc(NODE_BLUEPRINTS_REF, nid), {
            title: hint || 'Untitled Node',
            author_uid: author_uid,
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

            trust_level: 'New',
            official_note: '',
        });

        return await this.getNodeBluePrintFromNID(nid);
    }

    async forkNode(nid: string, author_uid: string): Promise<NodeBluePrint> {
        const newNid = `node_forked_${uuidv4()}`;
        const createdAt = new Date();

        await getDoc(doc(NODE_BLUEPRINTS_REF, nid)).then(async (value) => {
            if (value && value.exists()) {
                const data = value.data();
                data.title = `Fork of ${data.title}`;
                data.author_uid = author_uid;
                data.created_at = createdAt;
                data.last_updated_at = createdAt;
                data.is_frozen = false;
                data.predecessor_nid = nid;
                data.trust_level = 'New';
                await setDoc(doc(NODE_BLUEPRINTS_REF, newNid), data);
            } else {
                console.error(`Node not found: ${nid}`);
            }
        });

        return await this.getNodeBluePrintFromNID(newNid);
    }

    async getNodeBluePrintFromNID(nid: string): Promise<NodeBluePrint> {
        const nbp = new NodeBluePrintInFirestore(nid);
        await nbp.loadFromFirestore();
        return nbp;
    }
}

export class NodeBluePrintInFirestore extends NodeBluePrint {

    private current: FirestoreNodeBluePrintModel = DEFAULT_FIRESTORE_NODE_BLUEPRINT_MODEL;
    readonly nid: string;

    // Firestore subscriptions
    private unsubscribeFirestore: Unsubscribe | null = null;

    constructor(nid: string) {
        super();
        this.nid = nid;
    }
    
    private getDoc() {
        return doc(NODE_BLUEPRINTS_REF, this.nid)
    }
    
    async loadFromFirestore(): Promise<void> {
        const nodeRef = this.getDoc();
        const docSnapshot = await getDoc(nodeRef);
        
        if (!docSnapshot.exists()) {
            throw new Error(`NodeBlueprint document not found in Firestore: ${this.nid}`);
        }
        
        const data = docSnapshot.data();
        this.current = {
            title: data.title || 'Untitled Operation',
            documentation: data.documentation || '',
            user_defined_code: data.user_defined_code || `console.error("Code not defined in ${this.nid}");`,
            input_sockets: data.input_sockets || {},
            input_socket_order: data.input_socket_order || [],
            output_sockets: data.output_sockets || {},
            output_socket_order: data.output_socket_order || [],
            author_uid: data.author_uid || '',
            created_at: data.created_at?.toDate() || new Date(),
            predecessor_nid: data.predecessor_nid || 'root',
            is_frozen: data.is_frozen as boolean,
            trust_level: data.trust_level || 'New',
            official_note: data.official_note || '',
            last_updated_at: data.last_updated_at?.toDate() || new Date()
        };
    }

    private assertNotFrozen() {
        if (this.current.is_frozen) {
            throw new Error(`Node is frozen. Cannot be modified. Fork to modify: ${this.nid}`);
        }
    }
    
    // Clean up subscriptions
    destroy() {
        if (this.unsubscribeFirestore) {
            this.unsubscribeFirestore();
            this.unsubscribeFirestore = null;
        }
    }

    // NodeBluePrint implementation
    get author_uid(): string {
        return this.current.author_uid;
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

    get official_note(): string {
        return this.current?.official_note;
    }

    // Title and Documentation (stored at metadata level)
    get title(): string {
        return this.current.title;
    }

    set title(title: string) {
        this.current.title = title;
        // Update Firestore reactively
        this.update();
    }

    get documentation(): string {
        return this.current.documentation;
    }

    set documentation(documentation: string) {
        this.current.documentation = documentation;
        // Update Firestore reactively
        this.update();
    }

    // Code (stored at version level)
    get code(): string {
        return this.current?.user_defined_code;
    }

    set code(code: string) {
        this.assertNotFrozen();
        this.current.user_defined_code = code;
        this.current.last_updated_at = new Date();
        // Update Firestore reactively
        this.update();
    }

    // Socket management (stored at version level)
    async newInputSocket(socket_key: SocketID, socket: InputSocketModel<InputSocketParams>): Promise<void> {
        this.assertNotFrozen();
        // Update local model
        this.current.input_sockets[socket_key] = socket;
        if (!this.current.input_socket_order.includes(socket_key)) {
            this.current.input_socket_order.push(socket_key);
        }
        this.current.last_updated_at = new Date();

        // Update Firestore reactively
        this.update();
    }

    get inputSocketKeys(): Array<SocketID> {
        return this.current.input_socket_order;
    }

    get inputSockets(): Array<InputSocketModel<InputSocketParams>> {
        return this.current.input_socket_order.map(key => this.current.input_sockets[key]);
    }

    newOutputSocket(socket_key: SocketID, socket: OutputSocketModel): void {
        this.assertNotFrozen();
        // Update local model
        this.current.output_sockets[socket_key] = socket;
        if (!this.current.output_socket_order.includes(socket_key)) {
            this.current.output_socket_order.push(socket_key);
        }
        this.current.last_updated_at = new Date();
        
        // Update Firestore
        this.update();
    }

    get outputSockets(): Array<OutputSocketModel> {
        return this.current.output_socket_order.map(key => this.current.output_sockets[key]);
    }

    // Synchronous version using cached model
    outputSocketKeys(): Array<SocketID> {
        return this.current.output_socket_order;
    }

    // Execution
    async call(inputs: Record<string, unknown>, outputs: OutputSocketAsyncReturner): Promise<void> {
        try {
            const code = this.current.user_defined_code;

            if (!code || code.trim() === '') {
                throw new Error(`No code defined for node: ${this.nid}`);
            }

            // Create execution context
            const executionContext = {
                inputs,
                outputs,
                utils: {
                    // Add utility functions that nodes might need
                    Jimp: Jimp,
                    APIConnectionManager: NodeAPIConnectorManager,
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
            throw new Error(`Node execution failed: ${error}`);
        }
    }

    get is_frozen(): boolean {
        return this.current.is_frozen;
    }

    get last_updated_at(): Date {
        return this.current.last_updated_at;
    }

    protected async update(): Promise<void> {
        if (this.is_frozen) throw new Error(`Cannot update this node, it is frozen: ${this.nid}`);
        if (! this.current) throw new Error("Node not initialized");
        this.current.last_updated_at = new Date();
        await setDoc(this.getDoc(), this.current);
    }

    async freeze(): Promise<void> {
        this.current.is_frozen = true;
        this.current.last_updated_at = new Date();
        await setDoc(this.getDoc(), this.current);
    }
}
