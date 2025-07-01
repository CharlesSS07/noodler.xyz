import {
    onValue,
    ref,
    set,
    update,
    remove,
    type DatabaseReference,
} from 'firebase/database';
import { readable } from 'svelte/store';
import { rtdb } from './index';

type RTDBStore<T> = {
    subscribe: (run: (value: T | null) => void) => () => void;
    set: (value: T) => Promise<void>;
    update: (value: Partial<T>) => Promise<void>;
    remove: () => Promise<void>;
};

export function rtdbStore<T>(path: string): RTDBStore<T> {
    const dbRef: DatabaseReference = ref(rtdb, path);

    const { subscribe } = readable<T | null>(null, (setStore) => {
        const unsubscribe = onValue(dbRef, (snapshot) => {
            setStore(snapshot.exists() ? (snapshot.val() as T) : null);
        });
        return unsubscribe;
    });

    return {
        subscribe,
        set: (value: T) => set(dbRef, value),
        update: (value: Partial<T>) => update(dbRef, value),
        remove: () => remove(dbRef),
    };
}
