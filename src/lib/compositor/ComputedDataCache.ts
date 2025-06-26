import { writable, derived, type Writable, type Readable } from 'svelte/store';

// Types for better TypeScript support
type NodeKey = string;
type SocketId = string;

interface SocketInstance {
    node_key: NodeKey;
    socket_id: SocketId;
}

// Helper functions (you'll need to implement these based on your existing code)
function socketInstanceKey(node_key: string, socket_id: string): string {
    return `${node_key}:${socket_id}`;
}

function parseSocketInstanceKey(key: string): SocketInstance {
    const [node_key, socket_id] = key.split(':');
    return { node_key, socket_id };
}

export class ComputedDataCache {
    private data: Map<string, unknown> = new Map<string, unknown>();

    // Main reactive store that triggers updates when the data map changes
    private dataStore: Writable<Map<string, unknown>> = writable(new Map());

    // Store for tracking which sockets have data
    private socketKeysStore: Writable<Set<string>> = writable(new Set());

    constructor() {
        // Keep the stores in sync with the internal data
        this.updateStores();
    }

    private updateStores(): void {
        this.dataStore.set(new Map(this.data));
        this.socketKeysStore.set(new Set(this.data.keys()));
    }

    /**
     * Get a reactive store for a specific socket's data
     */
    useSocketStore(
        node_key: string,
        socket_id: string
    ): Readable<unknown | null> {
        const key = socketInstanceKey(node_key, socket_id);

        return derived(this.dataStore, ($data) => {
            return $data.has(key) ? $data.get(key) : null;
        });
    }

    /**
     * Get a reactive store that indicates whether a socket has data
     */
    hasSocketDataStore(node_key: string, socket_id: string): Readable<boolean> {
        const key = socketInstanceKey(node_key, socket_id);

        return derived(this.socketKeysStore, ($keys) => {
            return $keys.has(key);
        });
    }

    /**
     * Get a reactive store for a specific nodes error output
     */
    useNodeErrorStore(
        node_key: string,
    ): Readable<unknown | null> {
        const key = socketInstanceKey(node_key, '__error__');

        return derived(this.dataStore, ($data) => {
            return $data.has(key) ? $data.get(key) : null;
        });
    }

    /**
     * Get a reactive store for a specific nodes error output
     */
    useNodeExecutionStatusStore(
        node_key: string,
    ): Readable<unknown | null> {
        const key = socketInstanceKey(node_key, '__exec_status__');

        return derived(this.dataStore, ($data) => {
            return $data.has(key) ? $data.get(key) : 'idle';
        });
    }

    /**
     * Get a reactive store for all sockets belonging to a specific node
     */
    getNodeStore(node_key: string): Readable<Map<string, unknown>> {
        return derived(this.dataStore, ($data) => {
            const nodeData = new Map<string, unknown>();

            for (const [key, value] of $data.entries()) {
                const parsed = parseSocketInstanceKey(key);
                if (parsed.node_key === node_key) {
                    nodeData.set(parsed.socket_id, value);
                }
            }

            return nodeData;
        });
    }

    /**
     * Get a reactive store that returns all data (useful for debugging)
     */
    getAllDataStore(): Readable<Map<string, unknown>> {
        return { subscribe: this.dataStore.subscribe };
    }

    /**
     * Cache data for a socket
     */
    async cache(
        node_key: string,
        socket_id: string,
        data: unknown
    ): Promise<void> {
        const key = socketInstanceKey(node_key, socket_id);

        // if (this.data.has(key)) {
        //     throw new Error(`Socket ${key} already cached. This would overwrite the socket data. The whole node should have been dumped first.`);
        // }

        this.data.set(key, data);
        this.updateStores();
    }

    /**
     * Dump all caches for a specific node
     */
    async dumpNodeCaches(node_key: string): Promise<void> {
        const keysToDelete: string[] = [];

        for (const key of this.data.keys()) {
            const parsed = parseSocketInstanceKey(key);
            if (parsed.node_key === node_key) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.data.delete(key);
        }

        this.updateStores();
    }

    /**
     * Get socket data (non-reactive)
     */
    async get(node_key: string, socket_id: string): Promise<unknown> {
        const key = socketInstanceKey(node_key, socket_id);

        if (this.data.has(key)) {
            return this.data.get(key);
        }
        throw new Error(`Socket ${key} not found`);
    }

    /**
     * Check if socket has data (non-reactive)
     */
    has(node_key: string, socket_id: string): boolean {
        const key = socketInstanceKey(node_key, socket_id);
        return this.data.has(key);
    }

    /**
     * Remove specific socket data
     */
    async remove(node_key: string, socket_id: string): Promise<void> {
        const key = socketInstanceKey(node_key, socket_id);
        this.data.delete(key);
        this.updateStores();
    }

    /**
     * Clear all data
     */
    async clear(): Promise<void> {
        this.data.clear();
        this.updateStores();
    }
}
