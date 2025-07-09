import {type Node, type Edge} from '@xyflow/svelte';
import {ComputedDataCache} from './ComputedDataCache';
import {projectComputedDataCache} from '$lib/stores/ProjectState';
import {getBigData, type BigDataRef, isBigDataRef, autoConvertToBigData, autoConvertFromBigData} from './BigData';
import {createNodeBluePrintStore, getNodeBluePrintModel} from "$lib/compositor/NodeBluePrint";
import {executeNode} from "$lib/compositor/NodeEnvironment";

/**
 * 1. Build a dependency graph of libs that start_node_id depends on (ignore all others)
 * 2. Begin executing the source libs, i.e. the libs that everything depends on
 * 3. When a socket yields it's output, this should be final
 * 4. When all the sockets for a node are ready, execute that node.
 * 5. Store sockets in the global instance of OutputSocketDataCache in projectState
 * 6. When a socket is yielded, check the state and any libs that are ready should begin async execution
 * 7. Nodes are executed by calling the execute function. I will fill it in later.
 */



async function getNodeInputData(
    node: Node,
    edges: Edge[],
    dataCache: ComputedDataCache
): Promise<Record<string, unknown>> {
    /**
     * Collect all input data for a node from connected output sockets and node's internal data
     */
    const inputData: Record<string, unknown> = {};

    // Find all edges that target this node
    const incomingEdges = edges.filter((edge) => edge.target === node.id);
    const connectedInputs = new Set(
        incomingEdges.map((edge) => edge.targetHandle)
    );

    // Get data from connected edges
    for (const edge of incomingEdges) {
        if (edge.targetHandle && edge.sourceHandle) {
            try {
                const data = await dataCache.get(
                    edge.source,
                    edge.sourceHandle
                );

                // if the targetHandle has a . in it, then it might be accessing the child attribute
                // we should assign this child attribute if so
                // this allows for opening up a socket / have it be assigned in different ways if it's not a primitive!
                inputData[edge.targetHandle] = data;
            } catch (error) {
                throw error;
                // Input not available yet - this shouldn't happen if dependencies are tracked correctly
            }
        }
    }

    // For unconnected inputs, use node's internal data
    if (node.data?.input) {
        for (const [inputKey, inputValue] of Object.entries(node.data.input)) {
            if (!connectedInputs.has(inputKey)) {
                console.log(`Received input: ${inputKey}, ${inputValue}`);
                inputData[inputKey] = inputValue;
            }
        }
    } else {
        console.error(`Node ${node.id} does not have an input data store.`);
    }

    // Temporary. This replaces every BigDataRef with the value in the database
    for (const key in inputData) {
        inputData[key] = await autoConvertFromBigData(inputData[key]);
    }

    return inputData;
}

export async function executeFlowGraph(
    start_node_id: string,
    nodes: Node[],
    edges: Edge[]
): Promise<void> {

    // 1. Build dependency graph
    const dependencyGraph = buildDependencyGraph(start_node_id, nodes, edges);
    const relevantNodes = Array.from(dependencyGraph.keys());
    // const relevantNids: Set<string>

    // Load all node blueprints in parallel via getNodeBluePrintModel
    // Find sink nodes (nodes with no dependencies)
    // Start execution with sink nodes
}

function buildDependencyGraph(
    targetNodeId: string,
    nodes: Node[],
    edges: Edge[]
): Map<string, string[]> {
    /**
     * Build a dependency graph showing which libs each node depends on
     * Only includes libs that are in the dependency chain of the target node
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

