import type {
  InputSocketModel, InputSocketParams, OutputSocketModel, SocketID,
} from "./SocketModels";

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
    categories: string[];

    /**
     * Determines whether to refresh immediately after downstream changes, or refresh upon user request.
     */
    updates_on_downstream_change: boolean;

    /**
     * How much the nodes costs per run.
     */
    tokens_per_run: number;
}
