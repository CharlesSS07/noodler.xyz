import { Jimp } from 'jimp';
import { NodeAPIConnectorManager } from './NodeAPIConnector/NodeAPIConnectorManager.js';

export class OutputSocketDataCollection {
    /**
     * As the output value of an operator (represented by output sockets) become avaliable, we want to A) make sure the
     * script is not yielding sockets which should not exist, B) check that the socket is indeed the right type,
     * C) use/process the value as soon as it is avaliable rather than wait for all sockets to finish.
     */

    possibleIDs: Set<string>;
    onSocketValueEvents = new Map<string, (value: unknown) => Promise<void>>();
    setSockets = new Set<string>();
    socketPromises = new Map<string, Promise<void>>();
    resolveAllSet!: () => void;
    allSocketsSetPromise: Promise<void>;

    constructor(possibleIDs: Set<string>) {
        this.possibleIDs = possibleIDs;

        this.allSocketsSetPromise = new Promise<void>((resolve) => {
            // resolves when all sockets are set
            this.resolveAllSet = resolve;
        });
    }

    on(socket_key: string, callback: (value: unknown) => Promise<void>): this {
        if (!this.possibleIDs.has(socket_key)) {
            throw new Error(`Socket ${socket_key} is not a registered output`);
        }
        this.onSocketValueEvents.set(socket_key, callback);
        return this;
    }

    async set(socket_key: string, value: unknown) {
        if (!this.possibleIDs.has(socket_key)) {
            throw new Error(`Socket ${socket_key} is not a registered output`);
        }
        if (this.setSockets.has(socket_key)) {
            throw new Error(
                `Socket ${socket_key} was already set. You cannot set it again.`
            );
        }

        const callback = this.onSocketValueEvents.get(socket_key);
        if (!callback) {
            console.log(this.possibleIDs, callback);
            throw new Error(`No callback registered for socket ${socket_key}`);
        }

        this.setSockets.add(socket_key);
        const promise = callback(value);
        this.socketPromises.set(socket_key, promise);

        if (this.setSockets.size === this.possibleIDs.size) {
            // All sockets have been set, wait for all callbacks to resolve
            await Promise.all([...this.socketPromises.values()]);
            this.resolveAllSet(); // resolve the allSocketsSetPromise
        }
    }

    // Returns a promise that resolves when all sockets have been set and their callbacks resolved
    waitForAllSocketsSet(): Promise<void> {
        return this.allSocketsSetPromise;
    }
}

export type UserFunction = (
    inputs: Record<string, unknown>,
    outputs: OutputSocketDataCollection,
    utils: Record<string, unknown>
) => Promise<void>;

export const userFunctionAllowedModules = {
    log: (...args: unknown[]) => console.log('[User Log]', ...args),
    NodeLibManager: NodeAPIConnectorManager,
    Jimp,
};
