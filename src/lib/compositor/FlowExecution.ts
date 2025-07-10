import {type Node, type Edge} from '@xyflow/svelte';
import {ComputedDataCache} from './ComputedDataCache';
import {projectComputedDataCache} from '$lib/stores/ProjectState';
import { getNodeBluePrintModel} from "$lib/compositor/NodeBluePrint";
import {executeNode, OutputSocketAsyncReturner} from "$lib/compositor/NodeEnvironment";
import type {FirestoreNodeBluePrintModel} from "$shared/NodeBluePrintModel";
import {autoConvertFromBigData} from "$lib/compositor/BigData";

interface NodeExecutorInterface {

    /**
     * Iterates input sockets by key.
     */
    inputSocketKeys(): Set<string>;

    /**
     * Check that an input socket key exists on the node.
     * For nodes without strict specs, this should return true for any key.
     */
    hasSocket(socketId: string): boolean;

    /**
     * Checks that a socket has been assigned a value, or that the linked output socket has been
     * computed.
     */
    socketHasValue(socketId: string): boolean;

    /**
     * Checks for presence of required output sockets & socket values
     */
    isReadyToExecute(): boolean;

    /**
     * Pulls values from connected output sockets, and socket input data.
     */
    getInputs(): Promise<Record<string, unknown>>;

    /**
     * Hash all inputs so we can determine which nodes to re-execute when an input downstream has
     * changed.
     *
     * Hashes state of the node, which depends on values of all input sockets.
     *
     * Throws an error if a value is missing (a linked output socket has not been computed).
     */
    getInputStateHash(): string;

    /**
     * Fetches all inputs, and sets up a node execution call, and calls it.
     */
    execute(onSocketReturned?: () => void): Promise<void>;
}

async function startExecution(
    nodes: NodeExecutorInterface[]
) {

    const executedNodes: Set<NodeExecutorInterface> = new Set();
    const executing: Set<NodeExecutorInterface> = new Set();

    async function executeNode(node: NodeExecutorInterface) {
        if (executing.has(node)) {
            return; // Already executing
        }
        executing.add(node);
        executedNodes.add(node);
        
        try {
            await node.execute(executeReady);
        } finally {
            executing.delete(node);
        }
    }

    async function executeReady() {
        const readyNodes = nodes.filter(node => 
            !executedNodes.has(node) && 
            !executing.has(node) && 
            node.isReadyToExecute()
        );

        // Execute ready nodes sequentially to avoid race conditions
        for (const node of readyNodes) {
            await executeNode(node);
        }
    }

    await executeReady();

}


class NodeExecutor implements NodeExecutorInterface {
    private node: Node;
    private edges: Edge[];
    private dataCache: ComputedDataCache;
    private blueprint: FirestoreNodeBluePrintModel;

    constructor(node: Node, edges: Edge[], dataCache: ComputedDataCache, blueprint: FirestoreNodeBluePrintModel) {
        this.node = node;
        this.edges = edges;
        this.dataCache = dataCache;
        this.blueprint = blueprint;
    }

    inputSocketKeys(): Set<string> {
        if (!this.blueprint.input_spec_strict && this.node.data && this.node.data.input) {
            return new Set(
                this.blueprint.input_socket_order
            ).union(
                new Set(Object.keys(this.node.data?.input || {}))
            );
        }
        // For strict input spec, use all sockets defined in the blueprint
        // not just the ones in input_socket_order (which may be incomplete due to race conditions)
        return new Set(Object.keys(this.blueprint.input_sockets));
    }

    hasSocket(socketId: string): boolean {
        if (!this.blueprint.input_spec_strict) {
            return true;
        }
        return this.blueprint.input_sockets.hasOwnProperty(socketId);
    }

    socketHasValue(socketId: string): boolean {
        const incomingEdges = this.edges.filter((edge) => edge.target === this.node.id);
        const edge = incomingEdges.find(e => e.targetHandle === socketId);
        
        if (edge && edge.sourceHandle) {
            // Socket is connected - check if the source has computed data
            return this.dataCache.has(edge.source, edge.sourceHandle);
        } else {
            // Socket is not connected - check if node has internal data for this socket
            return this.node.data?.input?.hasOwnProperty(socketId) ?? false;
        }
    }

    isReadyToExecute(): boolean {
        // Check all required input sockets have values
        for (const socketId of this.inputSocketKeys()) {
            if (!this.socketHasValue(socketId)) {
                return false;
            }
        }
        return true;
    }

    async getInputs(): Promise<Record<string, unknown>> {
        const inputs: Record<string, unknown> = {};

        for (const socketId of this.inputSocketKeys()) {
            const incomingEdges = this.edges.filter((edge) => edge.target === this.node.id);
            const edge = incomingEdges.find(e => e.targetHandle === socketId);
            
            if (edge && edge.sourceHandle) {
                // Socket is connected - get value from data cache
                const rawValue = await this.dataCache.get(edge.source, edge.sourceHandle);
                inputs[socketId] = rawValue;
            } else {
                // Socket is not connected - use internal node data
                inputs[socketId] = await autoConvertFromBigData(this.node.data?.input?.[socketId]);
            }
        }

        console.log(inputs);

        return inputs;
    }

    getInputStateHash(): string {
        const inputKeys = Array.from(this.inputSocketKeys()).sort();
        const hashInput = inputKeys.map(key => {
            const edge = this.edges.find(e => e.target === this.node.id && e.targetHandle === key);
            if (edge && edge.sourceHandle) {
                return `${key}:${edge.source}:${edge.sourceHandle}`;
            } else {
                return `${key}:${JSON.stringify(this.node.data?.input?.[key])}`;
            }
        }).join('|');
        
        return btoa(hashInput);
    }

    async execute(onSocketReturned?: () => void): Promise<void> {
        this.dataCache.nodeExecutionStarted(this.node.id);

        try {
            const inputData = await this.getInputs();
            
            const outputSocketKeys = new Set(Object.keys(this.blueprint.output_sockets));
            const outputReturner = new FlowOutputSocketAsyncReturner(
                this.dataCache,
                this.node.id,
                outputSocketKeys,
                onSocketReturned
            );

            await executeNode(
                this.node.id,
                this.blueprint.user_defined_code,
                inputData,
                outputReturner
            );
        } catch (error) {
            this.dataCache.nodeExecutionLog(this.node.id, 'error', error.message || error);
            throw error;
        } finally {
            this.dataCache.nodeExecutionFinished(this.node.id);
        }

    }
}

class FlowOutputSocketAsyncReturner extends OutputSocketAsyncReturner {
    private onSocketReturned?: () => void;

    constructor(
        dataCache: ComputedDataCache,
        node_id: string,
        outputs: Set<string>,
        onSocketReturned?: () => void
    ) {
        super(dataCache, node_id, outputs);
        this.onSocketReturned = onSocketReturned;
    }

    async set(socket_id: string, data: unknown): Promise<void> {
        await super.set(socket_id, data);
        if (this.onSocketReturned) {
            this.onSocketReturned();
        }
    }
}

class FlowExecutor {
    private nodes: Node[];
    private edges: Edge[];
    private dataCache: ComputedDataCache;
    private nodeExecutors: Map<string, NodeExecutor> = new Map();
    private completedNodes: Set<string> = new Set();
    private dependencyGraph: Map<string, string[]> = new Map();

    constructor(nodes: Node[], edges: Edge[], dataCache: ComputedDataCache) {
        this.nodes = nodes;
        this.edges = edges;
        this.dataCache = dataCache;
    }

    async executeFlowGraph(start_node_id: string): Promise<void> {
        this.dependencyGraph = buildDependencyGraph(start_node_id, this.nodes, this.edges);
        const relevantNodes = Array.from(this.dependencyGraph.keys());

        const nodeMap = new Map<string, Node>();
        this.nodes.forEach(node => nodeMap.set(node.id, node));

        const nodeTypes = new Set<string>();
        relevantNodes.forEach(nodeId => {
            const node = nodeMap.get(nodeId);
            if (!node) throw new Error(`Node ${nodeId} not found`);
            if (!node.data || !node.data.nid) throw new Error(`Node ${nodeId} has no nid; cannot execute.`);
            nodeTypes.add(node.data.nid as string);
        });

        const blueprintMap = new Map<string, FirestoreNodeBluePrintModel>(
            await Promise.all(Array.from(nodeTypes).map(
                async (nodeType): Promise<[string, FirestoreNodeBluePrintModel]> => {
                    const blueprint = await getNodeBluePrintModel(nodeType);
                    return [nodeType, blueprint];
                }
            )));

        relevantNodes.forEach(nodeId => {
            const node = nodeMap.get(nodeId)!;
            const blueprint = blueprintMap.get(node.data.nid as string)!;
            this.nodeExecutors.set(nodeId, new NodeExecutor(node, this.edges, this.dataCache, blueprint));
        });

        await startExecution(Array.from(this.nodeExecutors.values()));
    }

}

export async function executeFlowGraph(
    start_node_id: string,
    nodes: Node[],
    edges: Edge[]
): Promise<void> {
    const dataCache = projectComputedDataCache;
    const executor = new FlowExecutor(nodes, edges, dataCache);
    await executor.executeFlowGraph(start_node_id);
}


function buildDependencyGraph(
    targetNodeId: string,
    nodes: Node[],
    edges: Edge[]
): Map<string, string[]> {
    /**
     * Build a dependency graph showing which nodes each node depends on
     * Only includes nodes that are in the dependency chain of the target node
     */
    const dependencyGraph = new Map<string, string[]>();
    const visited = new Set<string>();

    const traverse = (node_key: string): void => {
        if (visited.has(node_key)) return;
        visited.add(node_key);

        // Find all edges that target this node
        const incomingEdges = edges.filter((edge) => edge.target === node_key);
        const dependencies: string[] = [];

        incomingEdges.forEach((edge) => {
            dependencies.push(edge.source);
            traverse(edge.source); // Recursively traverse dependencies
        });

        dependencyGraph.set(node_key, dependencies);
    };

    traverse(targetNodeId);
    return dependencyGraph;
}

