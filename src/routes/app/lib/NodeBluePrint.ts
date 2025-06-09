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

export class NodeBluePrintVersionSpecifier {
    _node_key: string;
    _author_uid: string;
    _created_at: Date;

    constructor(node_key: string, author_uid: string, created_at: Date) {
        this._node_key = node_key;
        this._author_uid = author_uid;
        this._created_at = created_at;
    }

    toString() {
        return `${this._node_key}/${this._author_uid}:${this._created_at.getTime()}`;
    }

    get author_uid(): string {
        return this._author_uid;
    }

    get node_key(): string {
        return this._node_key;
    }

    get created_at(): Date {
        return this._created_at;
    }
}

export abstract class NodeBluePrint extends NodeBluePrintVersionSpecifier {

    abstract call(
        inputs: Record<string, unknown>,
        outputs: OutputSocketAsyncReturner
    ): Promise<void>;

    get nid(): string {
        return this.toString();
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
    abstract outputSocketKeys(): Promise<string[]>;
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
