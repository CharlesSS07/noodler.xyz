import {type Node, type Edge} from "@xyflow/svelte";
import { NodeBluePrintInFirestore } from "./FirestoreNodeBluePrint";
import type {NodeBluePrint} from "./NodeBluePrint";
import {OutputSocketDataCache} from "./OutputSocketDataCache";
import {projectOutputDataCache} from "$lib/stores/ProjectState";

function socketInstanceKey(node_id: string, socket_id: string) {
    return `${node_id}:${socket_id}`;
}

function parseSocketInstanceKey(socketInstanceKey: string) {
    const [node_id, socket_id] = socketInstanceKey.split(":");
    return {node_id: node_id, socket_id: socket_id};
}

class CyclicDependencyException extends Error {}

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

    // 1. Build dependency graph
    const dependencyGraph = buildDependencyGraph(start_node_id, nodes, edges);
    const relevantNodes = Array.from(dependencyGraph.keys());

    console.log(`Relevant nodes: ${JSON.stringify(relevantNodes)}`);

    console.log(`Found ${relevantNodes.length} nodes in dependency chain:`, relevantNodes);

    const nodeLookup = new Map<string, number>(nodes.map((node, index) => [node.id, index]));

    const relevantNids: Array<string> = [];
    relevantNodes.forEach(node_key => {
        const idx = nodeLookup.get(node_key);
        if (idx && nodes[idx].data.nid) {
            relevantNids.push(nodes[idx].data.nid as string);
        }
    });

    const relevantNodeBluePrintsLookup = new Map<string, NodeBluePrint>(
        relevantNids.map((nid) => [nid, new NodeBluePrintInFirestore(nid)])
    );

    // Find sink nodes (nodes with no dependencies)
    const sinkNodes = relevantNodes.filter(nodeId => {
        const dependencies = dependencyGraph.get(nodeId) || [];
        return dependencies.length === 0;
    });
    
    console.log(`Found ${sinkNodes.length} sink nodes:`, sinkNodes);
    
    // Track which nodes have been executed
    const executedNodes = new Set<string>();
    const executingNodes = new Set<string>();
    
    // Function to check if a node is ready for execution
    const isNodeReady = (nodeId: string): boolean => {
        const dependencies = dependencyGraph.get(nodeId) || [];
        return dependencies.every(depId => executedNodes.has(depId));
    };
    
    // Function to execute a single node
    const executeNode = async (nodeId: string): Promise<void> => {
        if (executedNodes.has(nodeId) || executingNodes.has(nodeId)) {
            return;
        }
        
        executingNodes.add(nodeId);
        
        try {
            console.log(nodeId, nodes);
            const node = nodes.find(n => n.id === nodeId);
            if (!node || !node.data?.nid) {
                console.log('node', node);
                throw new Error(`Node ${nodeId} not found or missing nid`);
            }
            
            const nodeBlueprint = relevantNodeBluePrintsLookup.get(node.data.nid as string);
            if (!nodeBlueprint) {
                throw new Error(`NodeBlueprint not found for nid: ${node.data.nid}`);
            }
            await nodeBlueprint.onReady;
            
            // Get input data for the node
            const inputData = await getNodeInputData(nodeId, nodes, edges, projectOutputDataCache);
            
            // Create output returner
            const outputSocketIds = new Set(nodeBlueprint.outputSocketKeys());
            console.log('using socket keys:', outputSocketIds);
            const outputReturner = new OutputSocketAsyncReturner(projectOutputDataCache, nodeId, outputSocketIds);
            
            // Execute the node (this would be implemented by each node type)
            // For now, we'll simulate execution
            // console.log(`Node ${nodeId} would execute with inputs:`, inputData);
            nodeBlueprint.call(inputData, outputReturner).then(() => {
                console.log(`Executed node ${nodeId} successfully!`);
            }).catch((err) => {
                console.log(`Executing node ${nodeId} failed!`);
                console.error(err);
            }).finally(() => {

            });

            // Mark as executed
            executedNodes.add(nodeId);
            executingNodes.delete(nodeId);
            
            // Check if any other nodes are now ready for execution
            const readyNodes = relevantNodes.filter(id => 
                !executedNodes.has(id) && 
                !executingNodes.has(id) && 
                isNodeReady(id)
            );
            
            // Execute ready nodes concurrently
            await Promise.all(readyNodes.map(executeNode));
            
        } catch (error) {
            executingNodes.delete(nodeId);
            console.error(`Failed to execute node ${nodeId}:`, error);
            throw error;
        }
    };
    
    // Start execution with sink nodes
    await Promise.all(sinkNodes.map(executeNode));

    console.log('dataCache', projectOutputDataCache)

    console.log(`Flow graph execution completed for node: ${start_node_id}`);
}

function buildDependencyGraph(targetNodeId: string, nodes: Node[], edges: Edge[]): Map<string, string[]> {
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
        const incomingEdges = edges.filter(edge => edge.target === node_key);
        const dependencies: string[] = [];
        
        incomingEdges.forEach(edge => {
            dependencies.push(edge.source);
            traverse(edge.source); // Recursively traverse dependencies
        });
        
        dependencyGraph.set(node_key, dependencies);
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
    const connectedInputs = new Set(incomingEdges.map(edge => edge.targetHandle));//.filter(Boolean));
    
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

    console.log('inputData', nodeId, inputData);
    
    return inputData;
}
