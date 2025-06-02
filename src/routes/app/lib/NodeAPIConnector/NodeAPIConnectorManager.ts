export abstract class NodeLib<T extends object> {
	name: string;
	connection: T | undefined = undefined;

	constructor(name: string) {
		this.name = name;
	}

	abstract setupConnection(): Promise<void>;

	async connect(): Promise<void> {
		console.info(`Attempting to connect API: ${this.name}`);
		await this.setupConnection();
		console.info(`Connected API: ${this.name}`);
	}

	disconnect() {
		this.connection = undefined;
	}

	async getAPI(): Promise<T> {
		if (this.connection !== undefined) return Promise.resolve(this.connection);
		await this.connect();
		return this.getAPI();
	}
}

export class NodeAPIConnectorManager {
	static connections: Map<string, NodeLib<any>> = new Map<string, NodeLib<any>>();

	static registerAPIConnector<T extends object>(connector: NodeLib<T>) {
		NodeAPIConnectorManager.connections.set(connector.name, connector);
		console.log(connector);
		return connector;
	}

	static getConnector<T extends object>(name: string): NodeLib<T> {
		const ret: NodeLib<T> | undefined = NodeAPIConnectorManager.connections.get(name);
		if (!ret) throw new Error(`Connector not registered:${name}`);
		return ret;
	}

	static hasConnector(name: string): boolean {
		return NodeAPIConnectorManager.connections.has(name);
	}
}
