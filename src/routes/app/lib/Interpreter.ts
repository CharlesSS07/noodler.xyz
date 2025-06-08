
function socketInstanceKey(node_id: string, socket_id: string) {
    return `${node_id}:${socket_id}`;
}

function parseSocketInstanceKey(socketInstanceKey: string) {
    const [node_id, socket_id] = socketInstanceKey.split(":");
    return {node_id: node_id, socket_id: socket_id};
}

export class OutputSocketDataCache {

    private data: Map<string, unknown> = new Map<string, unknown>();
    // private lastUsed: Map<string, number> = new Map<string, number>();

    constructor() {
    }

    async cache(node_id: string, socket_id: string, data: unknown): Promise<void> {
        const key = socketInstanceKey(node_id, socket_id);

        if (this.data.has(key)) {
            throw new Error(`Socket ${key} already cached. This would overwrite the socket data. The whole node should have been dumped first.`)
        }

        this.data.set(key, data);
        // this.lastUsed.set(key, new Date().getTime());
    }

    async dumpNodeCaches(node_id: string): Promise<void> {
        for (const socketInstanceKey in this.data.keys()) {
            if (parseSocketInstanceKey(socketInstanceKey).node_id === node_id) {
                this.data.delete(socketInstanceKey);
                // this.lastUsed.delete(socketInstanceKey);
            }
        }
    }

    async get(node_id: string, socket_id: string) {
        const key = socketInstanceKey(node_id, socket_id);

        if (this.data.has(key)) {
            // this.lastUsed.set(key, new Date().getTime());
            return this.data.get(key); // even if it's null
        }
        throw new Error(`Socket ${key} not found`);
    }

}

export class OutputSocketAsyncReturner {
    output: Set<string>;
    private listeners: Map<string, ((data: unknown) => void | Promise<void>)[]> = new Map();

    constructor(outputs: Set<string>) {
        this.output = outputs;
    }

    async set(name: string, value: unknown): Promise<void> {
        if (this.output.has(name)) {
            const listeners = this.listeners.get(name);
            if (listeners) {
                await Promise.all(listeners.map(listener => listener(value)));
            }
        } else {
            throw new Error(`Unable to resolve unregistered socket: ${name}`);
        }
    }

    async onResolve(name: string, callback: {(data: unknown): void | Promise<void>}): Promise<void> {
        if (this.listeners.has(name)) {
            const listeners = this.listeners.get(name);
            if (listeners) {
                listeners.push(callback);
            }
        } else {
            this.listeners.set(name, [callback]);
        }
    }
}
