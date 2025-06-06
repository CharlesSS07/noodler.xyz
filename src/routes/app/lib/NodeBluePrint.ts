import type {
    InputSocketModel,
    InputSocketParams,
    OutputSocketModel,
    SocketID,
} from './SocketModels.js';
import type { OutputSocketDataCollection } from './Execution.js';

export interface NodeBluePrintModel {
    readonly nid: string;
    readonly predecessor_node: string;
    version: number;
    title: string;
    author_uid: string;

    last_updated_at: Date;
    created_at: Date;

    documentation: string;

    input_sockets: { [socket_key: SocketID]: InputSocketModel<never> };
    input_socket_order: SocketID[];
    output_sockets: { [socket_key: SocketID]: OutputSocketModel };
    output_socket_order: SocketID[];
    // 1. we can have multiple sockets with the same label
    // 2. sockets that are deleted in the config are still stored in the instance, but not displayed
    //    so if they are restored, the links still exist; good consistency
    // 3. sockets have a defined, unambiguous order.

    user_defined_code_snippet: string;

    trust_level:
        | 'Official'
        | 'Trusted'
        | 'New'
        | 'Flagged'
        | 'Untrusted'
        | 'Possibly Malicious'
        | 'Malicious';
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
        outputs: OutputSocketDataCollection
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
