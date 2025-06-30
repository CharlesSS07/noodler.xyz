import type {
    InputSocketModel,
    InputSocketParams,
    OutputSocketModel,
    SocketID,
} from '../SocketModels.js';
import { OutputSocketAsyncReturner } from '../Interpreter';
import { writable, type Writable } from 'svelte/store';

export interface NodeBluePrintControllerFactoryInterface {
    initNewNodeBluePrint(
        author_uid: string,
        hint?: string | undefined
    ): Promise<NodeBluePrint>;

    /**
     * This creates an official, verified operator.
     * @param uniqueFunctionName
     */
    initOfficialNodeBluePrint(
        uniqueFunctionName: string
    ): Promise<NodeBluePrint>;

    /**
     * This is not just copying all the logic and sockets, but specifies and gives credit to the node
     * which is being spun-off by referencing that node in the predecessor_nid. Kinda like forking a
     * git repo. This should probably be done in a cloud function but this should work.
     * @param author_uid
     */
    forkNode(nid: string, author_uid: string): Promise<NodeBluePrint>;

    getNodeBluePrintFromNID(nid: string): Promise<NodeBluePrint>;
}

/**
 * The NodeBluePrint is used in three areas:
 *
 * 1. displaying nodes in FlowGraph
 * 2. executing nodes
 * 3. node design studio
 */

export abstract class NodeBluePrint {
    /**
     * Does whatever it is to call the executable part of this node. Takes inputs, and sets the outputs.
     * @param inputs
     * @param outputs
     */
    abstract call(
        inputs: Record<string, unknown>,
        outputs: OutputSocketAsyncReturner
    ): Promise<void>;

    abstract get author_uid(): string;

    abstract get created_at(): Date;
    abstract get last_updated_at(): Date;
    protected abstract update(): void;
    abstract get is_frozen(): boolean;
    abstract freeze(): void;

    abstract get nid(): string;

    /**
     * The nid of the code this was forked from, for tracking version.
     */
    abstract get predecessor_nid(): string | undefined;

    abstract newInputSocket(
        socket_key: SocketID,
        socket: InputSocketModel<InputSocketParams>
    ): void;
    abstract get inputSocketOrder(): Array<SocketID>;
    abstract get inputSockets(): Array<InputSocketModel<InputSocketParams>>;
    // abstract migrateInputSocket(socket_key: SocketID, new_socket_key: SocketID): Promise<void>;
    // abstract retireInputSocket(socket_key: SocketID): Promise<void>;
    // abstract unretireInputSocket(socket_key: SocketID): Promise<void>;

    abstract newOutputSocket(
        socket_key: SocketID,
        socket: OutputSocketModel
    ): void;
    abstract get outputSocketOrder(): Array<SocketID>;
    abstract get outputSockets(): Array<OutputSocketModel>;
    // abstract migrateOutputSocket(socket_key: SocketID, new_socket_key: SocketID): Promise<void>;
    // abstract retireOutputSocket(socket_key: SocketID): Promise<void>;
    // abstract unretireOutputSocket(socket_key: SocketID): Promise<void>;

    abstract set documentation(documentation: string);
    abstract get documentation(): string;

    abstract set title(title: string);
    abstract get title(): string;

    abstract get input_spec_strict(): boolean;
    abstract set input_spec_strict(spec_strict: boolean);

    abstract set code(title: string);
    abstract get code(): string;

    abstract get trust_level(): string;
    abstract set trust_level(trust_level: string);

    abstract get official_note(): string;
    abstract set official_note(note: string);

    abstract get searchable(): boolean;
    abstract notSearchable(): void;
    abstract isSearchable(): void;

    abstract get tags(): string[];
    abstract set tags(tags: string[]);
}

// Wrapper function to create a reactive store
export function createNodeBluePrintStore(
    nodeBluePrint: NodeBluePrint
): Writable<NodeBluePrint> {
    return writable(nodeBluePrint);
}

// Helper function to trigger store updates after mutations
export function updateNodeBluePrintStore(
    store: Writable<NodeBluePrint>,
    updateFn: (node: NodeBluePrint) => void | Promise<void>
) {
    store.update((node) => {
        const result = updateFn(node);

        // Handle async updates
        if (result instanceof Promise) {
            result.then(() => store.set(node));
        }

        return node;
    });
}
