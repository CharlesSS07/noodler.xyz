import {readable, type Readable} from "svelte/store";
import {firestore} from "../../firebase";
import {collection, doc, onSnapshot, getDoc} from "firebase/firestore";
import type {FirestoreNodeBluePrintModel} from "../../../functions/src/shared/NodeBluePrintModel";

export async function getNodeBluePrintModel(nid: string): Promise<FirestoreNodeBluePrintModel> {
    return await getDoc(
        doc(collection(firestore, "nodes"), nid)
    ).then((snapshot) => {
        if (snapshot.exists()) {
            return snapshot.data() as FirestoreNodeBluePrintModel;
        }
        throw new Error(`Node blueprint not found: ${nid}`);
    });
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