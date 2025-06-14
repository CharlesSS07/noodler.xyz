export abstract class NodeLib<T extends object> {
    name: string;
    connection: T | undefined = undefined;

    constructor(name: string) {
        this.name = name;
    }

    abstract setupConnection(): Promise<void>;

    async connect(): Promise<void> {
        await this.setupConnection();
    }

    disconnect() {
        this.connection = undefined;
    }

    async getAPI(): Promise<T> {
        if (this.connection !== undefined)
            return Promise.resolve(this.connection);
        await this.connect();
        return this.getAPI();
    }
}

export class NodeAPIConnectorManager {
    static connections: Map<string, NodeLib<object>> = new Map<
        string,
        NodeLib<object>
    >();

    static registerAPIConnector<T extends object>(
        connector: NodeLib<T>
    ): NodeLib<T> {
        NodeAPIConnectorManager.connections.set(connector.name, connector);
        return connector;
    }

    static getConnector<T extends object>(name: string): NodeLib<T> {
        const ret = NodeAPIConnectorManager.connections.get(name) as
            | NodeLib<T>
            | undefined;
        if (!ret) throw new Error(`Connector not registered:${name}`);
        return ret;
    }

    static hasConnector(name: string): boolean {
        return NodeAPIConnectorManager.connections.has(name);
    }
}
