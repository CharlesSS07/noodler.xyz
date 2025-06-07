import type {Node, Edge} from "@xyflow/svelte";
import type {NodeBluePrintControllerInterface} from './NodeBluePrint.js';
import type {SocketID} from './SocketModels.js';

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

export class InputSocketAsyncReceiver {
    input: Set<string>;
    inputValues: Record<string, unknown> = {};
    private requiredInputs: Set<string>;
    private onAllInputsReady: (() => void | Promise<void>) | null = null;
    private executionPromise: Promise<void> | null = null;

    constructor(input: Set<string>, requiredInputs: Set<string>) {
        this.input = input;
        this.requiredInputs = requiredInputs;
    }

    async set(name: string, value: unknown): Promise<void> {
        if (this.input.has(name)) {
            this.inputValues[name] = value;
            
            // Check if all required inputs are now filled
            if (this.areAllRequiredInputsFilled() && this.onAllInputsReady && !this.executionPromise) {
                this.executionPromise = Promise.resolve(this.onAllInputsReady());
                await this.executionPromise;
            }
        }
    }

    private areAllRequiredInputsFilled(): boolean {
        return Array.from(this.requiredInputs).every(inputName => 
            inputName in this.inputValues
        );
    }

    setOnAllInputsReady(callback: () => void | Promise<void>): void {
        this.onAllInputsReady = callback;
        
        // Check if inputs are already ready
        if (this.areAllRequiredInputsFilled() && !this.executionPromise) {
            this.executionPromise = Promise.resolve(callback());
        }
    }

    getInputs(): Map<SocketID, unknown> {
        const map = new Map<SocketID, unknown>();
        for (const [key, value] of Object.entries(this.inputValues)) {
            map.set(key, value);
        }
        return map;
    }
}

interface NodeExecutionContext {
    node: Node;
    nodeBlueprint: NodeBluePrintControllerInterface;
    inputReceiver: InputSocketAsyncReceiver;
    outputReturner: OutputSocketAsyncReturner;
    isExecuting: boolean;
    isCompleted: boolean;
}

export class DecentralizedFlowInterpreter {
    private nodes: Map<string, NodeExecutionContext> = new Map();
    private edges: Edge[] = [];
    private executionListeners: Set<(nodeId: string, status: 'started' | 'completed' | 'error') => void> = new Set();

    constructor() {}

    initializeFlow(
        nodes: Node[], 
        edges: Edge[], 
        nodeBlueprints: Map<string, NodeBluePrintControllerInterface>
    ): void {
        this.edges = [...edges];
        this.nodes.clear();

        // Initialize execution contexts for each node
        for (const node of nodes) {
            const blueprint = nodeBlueprints.get(node.id);
            if (!blueprint) {
                throw new Error(`Node blueprint not found for node: ${node.id}`);
            }

            // Get input and output socket information from node data
            const inputSocketKeys = new Set(Object.keys(node.data.inputSockets || {}));
            const outputSocketKeys = new Set(Object.keys(node.data.outputSockets || {}));
            const requiredInputs = new Set(
                Object.entries(node.data.inputSockets || {})
                    .filter(([_, socket]: [string, any]) => socket.required !== false)
                    .map(([key, _]) => key)
            );

            const inputReceiver = new InputSocketAsyncReceiver(inputSocketKeys, requiredInputs);
            const outputReturner = new OutputSocketAsyncReturner(outputSocketKeys);

            const context: NodeExecutionContext = {
                node,
                nodeBlueprint: blueprint,
                inputReceiver,
                outputReturner,
                isExecuting: false,
                isCompleted: false
            };

            this.nodes.set(node.id, context);
        }

        // Setup data propagation between connected nodes
        this.setupDataPropagation();
    }

    private setupDataPropagation(): void {
        for (const edge of this.edges) {
            const sourceContext = this.nodes.get(edge.source);
            const targetContext = this.nodes.get(edge.target);

            if (!sourceContext || !targetContext) {
                console.warn(`Invalid edge: ${edge.source} -> ${edge.target}`);
                continue;
            }

            // When source node outputs data, propagate it to target node
            sourceContext.outputReturner.onResolve(
                edge.sourceHandle || 'default',
                async (data: unknown) => {
                    await targetContext.inputReceiver.set(
                        edge.targetHandle || 'default',
                        data
                    );
                }
            );
        }

        // Setup execution triggers for each node
        for (const [nodeId, context] of this.nodes) {
            context.inputReceiver.setOnAllInputsReady(async () => {
                await this.executeNode(nodeId);
            });
        }
    }

    private async executeNode(nodeId: string): Promise<void> {
        const context = this.nodes.get(nodeId);
        if (!context) {
            throw new Error(`Node context not found: ${nodeId}`);
        }

        if (context.isExecuting || context.isCompleted) {
            return; // Prevent duplicate execution
        }

        context.isExecuting = true;
        this.notifyExecutionListeners(nodeId, 'started');

        try {
            // Execute the node's blueprint with collected inputs
            const inputs = context.inputReceiver.getInputs();
            await context.nodeBlueprint.call(inputs, context.outputReturner);

            context.isCompleted = true;
            context.isExecuting = false;
            this.notifyExecutionListeners(nodeId, 'completed');

        } catch (error) {
            context.isExecuting = false;
            this.notifyExecutionListeners(nodeId, 'error');
            console.error(`Error executing node ${nodeId}:`, error);
            throw error;
        }
    }

    startExecution(startNodeIds: string[]): Promise<void[]> {
        const promises: Promise<void>[] = [];

        for (const nodeId of startNodeIds) {
            const context = this.nodes.get(nodeId);
            if (!context) {
                console.warn(`Start node not found: ${nodeId}`);
                continue;
            }

            // For start nodes, trigger execution immediately if they have no required inputs
            // or if all their required inputs have default values
            if (context.inputReceiver['areAllRequiredInputsFilled']()) {
                promises.push(this.executeNode(nodeId));
            } else {
                // Set default values for inputs that have them
                const inputSockets = context.node.data.inputSockets || {};
                for (const [socketId, socket] of Object.entries(inputSockets)) {
                    if (socket.params?.default_value !== undefined) {
                        context.inputReceiver.set(socketId, socket.params.default_value);
                    }
                }
            }
        }

        return Promise.all(promises);
    }

    addExecutionListener(listener: (nodeId: string, status: 'started' | 'completed' | 'error') => void): void {
        this.executionListeners.add(listener);
    }

    removeExecutionListener(listener: (nodeId: string, status: 'started' | 'completed' | 'error') => void): void {
        this.executionListeners.delete(listener);
    }

    private notifyExecutionListeners(nodeId: string, status: 'started' | 'completed' | 'error'): void {
        for (const listener of this.executionListeners) {
            try {
                listener(nodeId, status);
            } catch (error) {
                console.error('Error in execution listener:', error);
            }
        }
    }

    reset(): void {
        for (const context of this.nodes.values()) {
            context.isExecuting = false;
            context.isCompleted = false;
            context.inputReceiver.inputValues = {};
        }
    }

    getNodeExecutionStatus(nodeId: string): { isExecuting: boolean; isCompleted: boolean } | null {
        const context = this.nodes.get(nodeId);
        return context ? {
            isExecuting: context.isExecuting,
            isCompleted: context.isCompleted
        } : null;
    }
}

// Legacy function for backwards compatibility
export function executeFlowGraph(
    startNode: string,
    nodes: Node[],
    edges: Edge[],
    onExecuteNode: {(input: Record<string, unknown>, output: OutputSocketAsyncReturner): void},
): DecentralizedFlowInterpreter {
    const interpreter = new DecentralizedFlowInterpreter();
    
    // Create mock blueprints that use the provided callback
    const blueprints = new Map<string, NodeBluePrintControllerInterface>();
    for (const node of nodes) {
        const mockBlueprint: NodeBluePrintControllerInterface = {
            nid: node.id,
            async call(inputs: Map<string, unknown>, outputs: OutputSocketAsyncReturner): Promise<void> {
                const inputRecord: Record<string, unknown> = {};
                for (const [key, value] of inputs) {
                    inputRecord[key] = value;
                }
                onExecuteNode(inputRecord, outputs);
            },
            async spinOffNode(): Promise<NodeBluePrintControllerInterface> { throw new Error('Not implemented'); },
            async newInputSocket(): Promise<void> { throw new Error('Not implemented'); },
            async getInputSocketKeysInOrder(): Promise<Array<string>> { return []; },
            async newOutputSocket(): Promise<void> { throw new Error('Not implemented'); },
            async getOutputSocketKeysInOrder(): Promise<string[]> { return []; },
            async setDocumentation(): Promise<void> { throw new Error('Not implemented'); },
            async getDocumentation(): Promise<string> { return ''; },
            async setTitle(): Promise<void> { throw new Error('Not implemented'); },
            async getTitle(): Promise<string> { return ''; },
            async setCode(): Promise<void> { throw new Error('Not implemented'); },
            async getCode(): Promise<string> { return ''; },
            async markAsUpdated(): Promise<void> { throw new Error('Not implemented'); },
            async getLastUpdatedTimestamp(): Promise<Date> { return new Date(); },
            async bumpVersion(): Promise<void> { throw new Error('Not implemented'); },
            async getVersion(): Promise<number> { return 1; },
            async updated(): Promise<void> { throw new Error('Not implemented'); }
        };
        blueprints.set(node.id, mockBlueprint);
    }

    interpreter.initializeFlow(nodes, edges, blueprints);
    interpreter.startExecution([startNode]);
    
    return interpreter;
}
