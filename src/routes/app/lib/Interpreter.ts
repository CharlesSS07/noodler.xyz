import {type Node, type Edge} from "@xyflow/svelte";
import { NodeBluePrintInFirestore } from "./FirestoreNodeBluePrint";

function socketInstanceKey(node_id: string, socket_id: string) {
    return `${node_id}:${socket_id}`;
}

function parseSocketInstanceKey(socketInstanceKey: string) {
    const [node_id, socket_id] = socketInstanceKey.split(":");
    return {node_id: node_id, socket_id: socket_id};
}

class CyclicDependencyException extends Error {}

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
        /**
         * Should be called when a node has any of it's inputs changed.
         * If a node is dumped then all nodes that depend on it should be dumped.
         */
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
    /**
     * This is part of the input to a node.
     */
    dataCache: OutputSocketDataCache;
    node_id: string;
    outputKeys: Set<string>;

    constructor(dataCache: OutputSocketDataCache, node_id: string, outputs: Set<string>) {
        this.dataCache = dataCache;
        this.node_id = node_id;
        this.outputKeys = outputs;
    }

    async set(socket_id: string, data: unknown): Promise<void> {
        if (this.outputKeys.has(socket_id)) {
            this.dataCache.cache(this.node_id, socket_id, data);
        } else {
            throw new Error(`Unable to resolve unregistered socket: ${socket_id}`);
        }
    }

}

async function execute(input: Record<string, unknown>, output: OutputSocketAsyncReturner, error: (error: Error) => void, node: Node): Promise<void> {
    /**
     * This executes a node using the code stored in its blueprint
     */
    try {
        if (!node?.data?.nid) {
            // For nodes without NID, treat them as pass-through nodes
            console.warn(`Node ${node.id} has no NID, treating as pass-through`);
            // Just pass the first input as output
            const firstInput = Object.values(input)[0];
            await output.set('output', firstInput);
            return;
        }
    } catch (err) {
        error(err instanceof Error ? err : new Error(String(err)));
        throw err;
    }
}


export async function executeFlowGraph(start_node_id: string, nodes: Node[], edges: Edge[]): Promise<void> {
    /**
     * 1. Build a dependency graph of nodes that start_node_id depends on (ignore all others)
     * 2. Begin executing the source nodes, i.e. the nodes that everything depends on
     * 3. When a socket yields it's output, this should be final
     * 4. When all the sockets for a node are ready, execute that node.
     * 5. Store sockets in the global instance of OutputSocketDataCache in projectState
     * 6. When a socket is yielded, check the state and any nodes that are ready should begin async execution
     * 7. Nodes are executed by calling the execute function. I will fill it in later.
     */
    
    console.log(`Executing flow graph starting from node: ${start_node_id}`);
    
    // Initialize global cache
    const dataCache = new OutputSocketDataCache();
    
    // 1. Build dependency graph
    const dependencyGraph = buildDependencyGraph(start_node_id, nodes, edges);
    const relevantNodes = Array.from(dependencyGraph.keys());
    
    console.log(`Found ${relevantNodes.length} nodes in dependency chain:`, relevantNodes);
    
    // Track node execution state
    const nodeStates = new Map<string, 'pending' | 'executing' | 'completed'>();
    relevantNodes.forEach(id => nodeStates.set(id, 'pending'));
    
    // Track which nodes are ready to execute
    const readyNodes = new Set<string>();
    
    // 2. Find source nodes (nodes with no dependencies)
    const sourceNodes = relevantNodes.filter(id => {
        const deps = dependencyGraph.get(id) || [];
        return deps.length === 0;
    });
    
    console.log(`Source nodes (no dependencies):`, sourceNodes);
    
    // Add source nodes to ready queue
    sourceNodes.forEach(id => readyNodes.add(id));
    
    // Function to check if a node's dependencies are satisfied
    const areNodeDependenciesSatisfied = (nodeId: string): boolean => {
        const dependencies = dependencyGraph.get(nodeId) || [];
        return dependencies.every(depNodeId => nodeStates.get(depNodeId) === 'completed');
    };
    
    // Function to find nodes that become ready after a node completes
    const findNewlyReadyNodes = (): string[] => {
        return relevantNodes.filter(id => 
            nodeStates.get(id) === 'pending' && 
            !readyNodes.has(id) && 
            areNodeDependenciesSatisfied(id)
        );
    };
    
    // Function to execute a single node
    const executeNode = async (nodeId: string): Promise<void> => {
        console.log(`Executing node: ${nodeId}`);
        nodeStates.set(nodeId, 'executing');
        
        const node = nodes.find(n => n.id === nodeId);
        if (!node) {
            throw new Error(`Node ${nodeId} not found`);
        }
        
        try {
            // Get input data for this node
            const inputData = await getNodeInputData(nodeId, nodes, edges, dataCache);
            
            // Get output socket definitions for this node
            const outputSockets = await getNodeOutputSockets(node);
            
            // Create output handler
            const outputHandler = new OutputSocketAsyncReturner(dataCache, nodeId, outputSockets);
            
            // Execute the node
            await execute(inputData, outputHandler, (error: Error) => {
                console.error(`Error executing node ${nodeId}:`, error);
                throw error;
            }, node);
            
            // Store results in node's data for easy access
            if (!node.data.output) node.data.output = {};
            for (const socketId of outputSockets) {
                try {
                    const value = await dataCache.get(nodeId, socketId);
                    node.data.output[socketId] = value;
                } catch (error) {
                    // Socket may not have been set
                }
            }
            
            console.log(`Node ${nodeId} completed successfully`);
            nodeStates.set(nodeId, 'completed');
            
            // Check for newly ready nodes
            const newlyReady = findNewlyReadyNodes();
            newlyReady.forEach(id => readyNodes.add(id));
            
            // Continue execution chain
            await processReadyNodes();
            
        } catch (error) {
            console.error(`Failed to execute node ${nodeId}:`, error);
            throw error;
        }
    };
    
    // Function to process all ready nodes
    const processReadyNodes = async (): Promise<void> => {
        const nodesToExecute = Array.from(readyNodes);
        readyNodes.clear();
        
        // Execute ready nodes in parallel
        const promises = nodesToExecute.map(nodeId => executeNode(nodeId));
        await Promise.all(promises);
    };
    
    // Start execution with source nodes
    await processReadyNodes();
    
    console.log(`Flow graph execution completed for node: ${start_node_id}`);
}

function buildDependencyGraph(targetNodeId: string, nodes: Node[], edges: Edge[]): Map<string, string[]> {
    /**
     * Build a dependency graph showing which nodes each node depends on
     * Only includes nodes that are in the dependency chain of the target node
     */
    const dependencyGraph = new Map<string, string[]>();
    const visited = new Set<string>();
    
    const traverse = (nodeId: string): void => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        // Find all edges that target this node
        const incomingEdges = edges.filter(edge => edge.target === nodeId);
        const dependencies: string[] = [];
        
        incomingEdges.forEach(edge => {
            dependencies.push(edge.source);
            traverse(edge.source); // Recursively traverse dependencies
        });
        
        dependencyGraph.set(nodeId, dependencies);
    };
    
    traverse(targetNodeId);
    return dependencyGraph;
}

async function getNodeInputData(nodeId: string, nodes: Node[], edges: Edge[], dataCache: OutputSocketDataCache): Promise<Record<string, unknown>> {
    /**
     * Collect all input data for a node from connected output sockets and node's internal data
     */
    const inputData: Record<string, unknown> = {};
    
    // Find the node
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
        throw new Error(`Node ${nodeId} not found`);
    }
    
    // Find all edges that target this node
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    const connectedInputs = new Set(incomingEdges.map(edge => edge.targetHandle).filter(Boolean));
    
    // Get data from connected edges
    for (const edge of incomingEdges) {
        if (edge.targetHandle && edge.sourceHandle) {
            try {
                const data = await dataCache.get(edge.source, edge.sourceHandle);
                inputData[edge.targetHandle] = data;
            } catch (error) {
                console.warn(`Failed to get data for edge ${edge.source}:${edge.sourceHandle} -> ${edge.target}:${edge.targetHandle}:`, error);
                // Input not available yet - this shouldn't happen if dependencies are tracked correctly
            }
        }
    }
    
    // For unconnected inputs, use node's internal data
    if (node.data?.input) {
        for (const [inputKey, inputValue] of Object.entries(node.data.input)) {
            if (!connectedInputs.has(inputKey)) {
                inputData[inputKey] = inputValue;
            }
        }
    }
    
    return inputData;
}

async function getNodeOutputSockets(node: Node): Promise<Set<string>> {
    /**
     * Extract output socket IDs from a node using its blueprint
     */
    const outputSockets = new Set<string>();
    
    if (!node.data?.nid) {
        console.warn(`Node ${node.id} has no NID, using fallback output socket`);
        outputSockets.add('output');
        return outputSockets;
    }
    
    try {
        // For other nodes, try to get from blueprint system
        const controller = new NodeBluePrintInFirestore(node.data.nid);
        const outputSocketKeys = await controller.outputSocketKeys();
        if (outputSocketKeys && outputSocketKeys.length > 0) {
            outputSocketKeys.forEach(socketKey => {
                outputSockets.add(socketKey);
            });
        } else {
            console.warn(`No output sockets found for node blueprint ${node.data.nid}, using fallback`);
            outputSockets.add('output');
        }
    } catch (error) {
        console.error(`Failed to get blueprint for node ${node.data.nid}:`, error);
        // Fallback for custom nodes that might not have blueprints yet
        if (node.type === 'llm-content-generator') {
            outputSockets.add('generatedContent');
            outputSockets.add('metadata');
        } else if (node.type === 'html-tag') {
            outputSockets.add('htmlOutput');
        } else if (node.type === 'html-boilerplate') {
            outputSockets.add('fullHtml');
        } else if (node.type === 'web-navbar') {
            outputSockets.add('navbarHtml');
        } else {
            outputSockets.add('output');
        }
    }
    
    return outputSockets;
}
