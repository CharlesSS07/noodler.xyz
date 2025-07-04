import {readable, type Readable} from "svelte/store";
import {firestore} from "../../firebase";
import {collection, doc, onSnapshot} from "firebase/firestore";
import type {
    InputSocketModel,
    InputSocketParams, OutputSocketModel,
    SocketID
} from "../../../functions/src/nodeBlueprints/libs/SocketModels";


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


export function createNodeBluePrintStore(nid: string): Readable<FirestoreNodeBluePrintModel | undefined> {

    // check nid is not empty or null, etc.

    const store = readable<FirestoreNodeBluePrintModel | undefined>(undefined, (set) => {
        const ref = doc(collection(firestore, "nodes"), nid);
        const unsubscribe = onSnapshot(ref,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    set(data as FirestoreNodeBluePrintModel);
                }
            });
        return unsubscribe;
    });

    return store;


}