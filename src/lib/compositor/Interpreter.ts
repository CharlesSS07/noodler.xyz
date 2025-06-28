import { type Node, type Edge } from '@xyflow/svelte';
import { FirestoreNodeBluePrintControllerFactoryInterface } from './nodes/firestore/FirestoreNodeBluePrint';
import type { NodeBluePrint } from './nodes/NodeBluePrint';
import { ComputedDataCache } from './ComputedDataCache';
import { projectComputedDataCache } from '$lib/stores/ProjectState';
import { getBigData, type BigDataRef } from './BigData';

export class OutputSocketAsyncReturner {
    /**
     * This is part of the input to a node.
     */
    dataCache: ComputedDataCache;
    node_id: string;
    outputKeys: Set<string>;

    constructor(
        dataCache: ComputedDataCache,
        node_id: string,
        outputs: Set<string>
    ) {
        this.dataCache = dataCache;
        this.node_id = node_id;
        this.outputKeys = outputs;
    }

    async set(socket_id: string, data: unknown): Promise<void> {
        if (this.outputKeys.has(socket_id)) {
            this.dataCache.cache(this.node_id, socket_id, data);
        } else {
            throw new Error(
                `Unable to resolve unregistered socket: ${socket_id}`
            );
        }
    }

    async errorMessage(error: string) {
        await this.dataCache.cache(this.node_id, '__error__', error);
    }
}

export async function executeFlowGraph(
    start_node_id: string,
    nodes: Node[],
    edges: Edge[]
): Promise<void> {
    /**
     * 1. Build a dependency graph of nodes that start_node_id depends on (ignore all others)
     * 2. Begin executing the source nodes, i.e. the nodes that everything depends on
     * 3. When a socket yields it's output, this should be final
     * 4. When all the sockets for a node are ready, execute that node.
     * 5. Store sockets in the global instance of OutputSocketDataCache in projectState
     * 6. When a socket is yielded, check the state and any nodes that are ready should begin async execution
     * 7. Nodes are executed by calling the execute function. I will fill it in later.
     */

    // 1. Build dependency graph
    const dependencyGraph = buildDependencyGraph(start_node_id, nodes, edges);
    console.log('dependencyGraph', dependencyGraph);
    const relevantNodes = Array.from(dependencyGraph.keys());

    const nodeLookup = new Map<string, number>(
        nodes.map((node, index) => [node.id, index])
    );

    const relevantNids: Array<string> = [];
    relevantNodes.forEach((node_key) => {
        const idx = nodeLookup.get(node_key);
        if (idx !== undefined && nodes[idx].data.nid) {
            relevantNids.push(nodes[idx].data.nid as string);
        }
    });

    const factory = new FirestoreNodeBluePrintControllerFactoryInterface();

    // Load all node blueprints in parallel
    const relevantNodeBluePrintsLookup = new Map<string, NodeBluePrint>();
    const blueprintPromises = relevantNids.map((nid) =>
        factory.getNodeBluePrintFromNID(nid)
    );
    const blueprints = await Promise.all(blueprintPromises);

    // Build the lookup map
    for (let i = 0; i < relevantNids.length; i++) {
        relevantNodeBluePrintsLookup.set(relevantNids[i], blueprints[i]);
    }
    console.log(nodes, edges, relevantNids, relevantNodeBluePrintsLookup);

    // Find sink nodes (nodes with no dependencies)
    const sinkNodes = relevantNodes.filter((nodeId) => {
        const dependencies = dependencyGraph.get(nodeId) || [];
        return dependencies.length === 0;
    });

    console.log('sinkNodes', sinkNodes);

    // Track which nodes have been executed
    const executedNodes = new Set<string>();
    const executingNodes = new Set<string>();

    // Function to check if a node is ready for execution
    const isNodeReady = (nodeId: string): boolean => {
        const dependencies = dependencyGraph.get(nodeId) || [];
        return dependencies.every((depId) => executedNodes.has(depId));
    };

    // Function to execute a single node
    const executeNode = async (nodeId: string): Promise<void> => {
        if (executedNodes.has(nodeId) || executingNodes.has(nodeId)) {
            return;
        }

        executingNodes.add(nodeId);

        try {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node || !node.data?.nid) {
                throw new Error(`Node ${nodeId} not found or missing nid`);
            }

            const nodeBlueprint = relevantNodeBluePrintsLookup.get(
                node.data.nid as string
            );
            if (!nodeBlueprint) {
                throw new Error(
                    `NodeBlueprint not found for nid: ${node.data.nid}`
                );
            }

            // Create output returner
            const outputSocketIds = new Set(nodeBlueprint.outputSocketKeys());
            // set up return data & error handling
            const outputReturner = new OutputSocketAsyncReturner(
                projectComputedDataCache,
                nodeId,
                outputSocketIds
            );

            try {
                // Get input data for the node
                const inputData = await getNodeInputData(
                    node,
                    edges,
                    projectComputedDataCache
                );

                if (nodeBlueprint.input_spec_strict) {
                    console.debug("Executing node in strict mode.")
                    // Check that input data and node blueprint spec inputs align
                    const inputDataSocketKeys = new Set(Object.keys(inputData));
                    const inputSocketKeysSpec = new Set(
                        nodeBlueprint.inputSocketKeys
                    );

                    // Check for extra socket keys (inputDataSocketKeys - inputSocketKeysSpec)
                    const extraKeys = Array.from(inputDataSocketKeys).filter(
                        (key) => !inputSocketKeysSpec.has(key)
                    );
                    if (extraKeys.length > 0) {
                        throw new Error(
                            `Extra socket keys supplied to input of node ${nodeId}: ${extraKeys.join(',')}. Received: ${Array.from(inputDataSocketKeys).join('.')}`
                        );
                    }

                    // Check for missing socket keys (inputSocketKeysSpec - inputDataSocketKeys)
                    const missingKeys = Array.from(inputSocketKeysSpec).filter(
                        (key) => !inputDataSocketKeys.has(key)
                    );
                    if (missingKeys.length > 0) {
                        throw new Error(
                            `Missing socket keys to input of node ${nodeId}: ${missingKeys.join('.')}. Received: ${Array.from(inputDataSocketKeys).join('.')}`
                        );
                    }
                    // TODO: input socket data type checking
                }

                console.log(`${nodeId} ▶️ (${nodeBlueprint.nid}) with args:`);
                console.log(inputData);

                // Execute the node
                projectComputedDataCache.nodeExecutionStarted(nodeId);
                await nodeBlueprint
                    .call(inputData, outputReturner)
                    .then(() => {
                        console.log(`${nodeId} ✅`, outputReturner);
                        outputReturner.errorMessage(''); // clear error
                    })
                    .catch((err) => {
                        console.error(`${nodeId} ❌`);
                        throw err;
                    }).finally(() => {
                        projectComputedDataCache.nodeExecutionFinished(nodeId);
                    });

                // Mark as executed
                executedNodes.add(nodeId);
                executingNodes.delete(nodeId);

                // Check if any other nodes are now ready for execution
                const readyNodes = relevantNodes.filter(
                    (id) =>
                        !executedNodes.has(id) &&
                        !executingNodes.has(id) &&
                        isNodeReady(id)
                );

                try {
                    // Execute ready nodes concurrently
                    await Promise.all(readyNodes.map(executeNode));
                } catch (error) {
                    console.error(error);
                    // do not throw; this is the error of another node.
                }
            } catch (error) {
                console.error('Error in node execution:');
                console.error(error);
                if (error instanceof Error) {
                    await outputReturner.errorMessage(
                        `While executing ${nodeBlueprint.nid} id=${nodeId}:\n${error.message}`
                    );
                } else {
                    await outputReturner.errorMessage(
                        `While executing ${nodeBlueprint.nid} id=${nodeId}:` +
                        error
                    ); // !!! convert to string first!
                    // error objects are some stupid fucking shit that can't be uploaded to firebase rtdb
                    // wasted my whole fucking day figuring out Error objects cannot be serialized by JSON.stringify
                }
                throw error;
            }
        } catch (error) {
            executingNodes.delete(nodeId);
            console.error(`Failed to execute node ${nodeId}:`);
            console.error(error);
            throw error;
        }
    };

    // Start execution with sink nodes
    await Promise.all(sinkNodes.map(executeNode));
    return Promise.resolve();
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
        if (
            inputData[key] &&
            // @ts-ignore
            inputData[key].hasOwnProperty('_type') &&
            // @ts-ignore
            inputData[key]._type == 'bigdata_ref'
        ) {
            inputData[key] = await getBigData(inputData[key] as BigDataRef);
        }
    }

    return inputData;
}
