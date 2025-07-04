import type {
    InputSocketModel,
    InputSocketParams,
    OutputSocketModel,
    SocketID,
} from './SocketModels.js';

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
}

/**
 * The NodeBluePrint is used in three areas:
 *
 * 1. displaying libs in FlowGraph
 * 2. executing libs
 * 3. node design studio
 */

export abstract class NodeBluePrint {

    abstract get owner(): string;
    abstract set owner(uid: string);
    abstract get editors(): string[];
    abstract addEditor(uid: string): void;
    abstract removeEditor(uid: string): void;
    abstract get viewers(): string[];
    abstract addViewer(uid: string): void;
    abstract removeViewer(uid: string): void;

    abstract get created_at(): Date;

    /**
     * When the node blueprint was last changed.
     */
    abstract get last_updated_at(): Date;

    /**
     * Set last_updated_at to the current time.
     * @protected
     */
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

    abstract get input_spec_strict(): boolean;
    abstract set input_spec_strict(spec_strict: boolean);

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

    abstract set code(title: string);
    abstract get code(): string;

    abstract get trust_level(): string;
    abstract set trust_level(trust_level: string);

    abstract get official_note(): string;
    abstract set official_note(note: string);

    abstract get searchable(): boolean;
    abstract set searchable(value: boolean);
    abstract notSearchable(): void;
    abstract isSearchable(): void;

    abstract get tags(): string[];
    abstract set tags(tags: string[]);

    /**
     * Converts the NodeBluePrint to a text description for embedding
     * @return {string} Text description of the NodeBluePrint
     */
    toString(): string {
        const parts: string[] = [];

        // Add title
        if (this.title) {
            parts.push(`Title: ${this.title}`);
        }

        // Add documentation/description
        if (this.documentation) {
            parts.push(`Description: ${this.documentation}`);
        }

        // Add tags
        if (this.tags && this.tags.length > 0) {
            parts.push(`Tags: ${this.tags.join(", ")}`);
        }

        // Add trust level
        if (this.trust_level) {
            parts.push(`Trust Level: ${this.trust_level}`);
        }

        // Add input specifications
        if (this.inputSockets && this.inputSockets.length > 0) {
            const inputSpecs = this.inputSockets.map(
                socket => {
                    return `${socket.label}(${socket.type}): ${socket.documentation}`;
                }
            ).join("; ");
            parts.push(`Input Sockets: ${inputSpecs}`);
        }

        // Add output specifications
        if (this.outputSockets && this.outputSockets.length > 0) {
            const outputSpecs = this.outputSockets.map(
                socket => {
                    return `${socket.label}(${socket.type}): ${socket.documentation}`;
                }
            ).join("; ");
            parts.push(`Output Sockets: ${outputSpecs}`);
        }

        // todo use llmFlow to summarize what code does, and add the summary to the description

        return parts.join("\n\n");
    }

}
