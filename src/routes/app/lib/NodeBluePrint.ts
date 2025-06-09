import type {
    InputSocketModel,
    InputSocketParams,
    OutputSocketModel,
    SocketID,
} from './SocketModels.js';
import {OutputSocketAsyncReturner} from "./Interpreter";

// to claude: the comments here are just thoughts. please do not change anything here (ask if it seems pertinent to your task at hand). just focus on the spec data you need.
export interface NodeBluePrintModel {
    readonly nid: string; // should now be dynamically generated {node_id}/{user_id}/{created_at: second in epoch}/{all the data}
    readonly predecessor_node: string; // reference to another node
    version: number; // should no longer be needed
    title: string;
    author_uid: string; // should be dynamically filled in

    last_updated_at: Date; // should no longer be needed
    created_at: Date; // should be dynamically filled in

    // everything after here is the data of the blueprint
    documentation: string;

    input_sockets: { [socket_key: SocketID]: InputSocketModel<never> }; // this is set once. the only way to change it is to derive a new node and alter that
    input_socket_order: SocketID[]; // this can easily be reshuffled in any manner
    output_sockets: { [socket_key: SocketID]: OutputSocketModel }; // this is set once, like input_sockets
    output_socket_order: SocketID[]; // this can easily be reshuffled in any manner.
    // 1. we can have multiple sockets with the same label
    // 2. sockets that are deleted in the config are still stored in the instance, but not displayed
    //    so if they are restored, the links still exist; good consistency
    // 3. sockets have a defined, unambiguous order.

    user_defined_code: string;

    trust_level:
        | 'Official'
        | 'Trusted'
        | 'New'
        | 'Flagged'
        | 'Untrusted'
        | 'Possibly Malicious'
        | 'Malicious';

    official_notes: string; // this is for adding warnings for users. from official team
}

export interface NodeBluePrintControllerFactoryInterface {
    initNewNodeBluePrint(
        author_uid: string,
        hint?: string | undefined
    ): Promise<NodeBluePrintControllerInterface>;

    /**
     * This creates an official, verified operator.
     * @param uniqueFunctionName
     */
    initOfficialNodeBluePrint(
        uniqueFunctionName: string
    ): Promise<NodeBluePrintControllerInterface>;
}

export interface NodeBluePrintControllerInterface {
    readonly nid: string;

    call(
        inputs: Map<SocketID, unknown>,
        outputs: OutputSocketAsyncReturner
    ): Promise<void>;

    /**
     * This is not just copying all the logic and sockets, but specifies and gives credit to the node
     * which is being spun-off by referencing that node in the predecessor_nid. Kinda like forking a
     * git repo.
     * @param newAuthor
     */
    spinOffNode(newAuthor: string): Promise<NodeBluePrintControllerInterface>;

    newInputSocket(
        socket_key: SocketID,
        socket: InputSocketModel<InputSocketParams>
    ): Promise<void>;
    getInputSocketKeysInOrder(): Promise<Array<SocketID>>;
    newOutputSocket(
        socket_key: SocketID,
        socket: OutputSocketModel
    ): Promise<void>;
    getOutputSocketKeysInOrder(): Promise<string[]>;
    setDocumentation(documentation: string): Promise<void>;
    getDocumentation(): Promise<string>;
    setTitle(title: string): Promise<void>;
    getTitle(): Promise<string>;
    setCode(user_defined_code_snippet: string): Promise<void>;
    getCode(): Promise<string>;
    markAsUpdated(): Promise<void>;
    getLastUpdatedTimestamp(): Promise<Date>;
    bumpVersion(): Promise<void>;
    getVersion(): Promise<number>;
    updated(): Promise<void>;
}
