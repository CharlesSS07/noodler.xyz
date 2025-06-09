import type {
    InputSocketModel,
    InputSocketParams,
    OutputSocketModel,
    SocketID,
} from './SocketModels.js';
import {OutputSocketAsyncReturner} from "./Interpreter";

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
}

export abstract class NodeBluePrint {

    abstract call(
        inputs: Record<string, unknown>,
        outputs: OutputSocketAsyncReturner
    ): Promise<void>;

    abstract get author_uid(): string;
    /**
     * Make a new node and set's author to author_uid.
     */
    abstract set author_uid(author_uid: string);

    abstract get node_key(): string;
    abstract set node_key(node_key: string);

    abstract get created_at(): Date;
    abstract set created_at(date: Date);

    get nid(): string {
        return `${this.node_key}/versions/${this.author_uid}:${this.created_at.getTime()}`;
    }

    set nid(nid: string) {
        const [node_key, author_uid, created_at_second]= nid.split('/');
        this.node_key = node_key;
        this.author_uid = author_uid;
        this.created_at = new Date(parseInt(created_at_second));
    }

    /**
     * The nid of the code this was forked from, for tracking version.
     */
    abstract get predecessor_nid(): string;

    /**
     * This is not just copying all the logic and sockets, but specifies and gives credit to the node
     * which is being spun-off by referencing that node in the predecessor_nid. Kinda like forking a
     * git repo. This should probably be done in a cloud function but this should work.
     * @param author_uid
     */
    abstract spinOffNode(author_uid: string): Promise<NodeBluePrint>;

    abstract newInputSocket(
        socket_key: SocketID,
        socket: InputSocketModel<InputSocketParams>
    ): Promise<void>;
    abstract get inputSocketKeys(): Array<SocketID>;
    abstract get inputSockets(): Array<InputSocketModel<InputSocketParams>>;
    // abstract migrateInputSocket(socket_key: SocketID, new_socket_key: SocketID): Promise<void>;
    // abstract retireInputSocket(socket_key: SocketID): Promise<void>;
    // abstract unretireInputSocket(socket_key: SocketID): Promise<void>;

    abstract newOutputSocket(
        socket_key: SocketID,
        socket: OutputSocketModel
    ): Promise<void>;
    abstract get outputSocketKeys(): string[];
    abstract get outputSockets(): Array<OutputSocketModel>;
    // abstract migrateOutputSocket(socket_key: SocketID, new_socket_key: SocketID): Promise<void>;
    // abstract retireOutputSocket(socket_key: SocketID): Promise<void>;
    // abstract unretireOutputSocket(socket_key: SocketID): Promise<void>;

    abstract set documentation(documentation: string);
    abstract get documentation(): string;

    abstract set title(title: string);
    abstract get title(): string;

    abstract get code(): string;
    abstract set code(code: string);
    initializeCode(newCode: string): void {
        const code = this.code;
        if (code && code.length>0) {
            throw new Error('NodeBluePrint code can only be set one time.');
        }
        this.code = newCode;
    }

    abstract get trust_level(): string;
    abstract set trust_level(trust_level: string);

    abstract get official_note(): string;
    abstract set official_note(note: string);
}
