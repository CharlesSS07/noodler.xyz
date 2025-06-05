import { Jimp } from 'jimp';
import { NodeAPIConnectorManager } from './NodeAPIConnector/NodeAPIConnectorManager.js';

import {
	type Node,
	type Edge,
} from '@xyflow/svelte';
import {FirestoreNodeBluePrintController} from "./FirestoreNodeBluePrint";

export class OutputSocketDataCollection {
	/**
	 * As the output value of an operator (represented by output sockets) become avaliable, we want to A) make sure the
	 * script is not yielding sockets which should not exist, B) check that the socket is indeed the right type,
	 * C) use/process the value as soon as it is avaliable rather than wait for all sockets to finish.
	 */

	possibleIDs: Set<string>;
	onSocketValueEvents = new Map<string, (value: unknown) => Promise<void>>();
	setSockets = new Set<string>();
	socketPromises = new Map<string, Promise<void>>();
	resolveAllSet!: () => void;
	allSocketsSetPromise: Promise<void>;

	constructor(possibleIDs: Set<string>) {
		this.possibleIDs = possibleIDs;

		this.allSocketsSetPromise = new Promise<void>((resolve) => {
			// resolves when all sockets are set
			this.resolveAllSet = resolve;
		});
	}

	on(socket_key: string, callback: (value: unknown) => Promise<void>): this {
		if (!this.possibleIDs.has(socket_key)) {
			throw new Error(`Socket ${socket_key} is not a registered output`);
		}
		this.onSocketValueEvents.set(socket_key, callback);
		return this;
	}

	async set(socket_key: string, value: unknown) {
		if (!this.possibleIDs.has(socket_key)) {
			throw new Error(`Socket ${socket_key} is not a registered output`);
		}
		if (this.setSockets.has(socket_key)) {
			throw new Error(`Socket ${socket_key} was already set. You cannot set it again.`);
		}

		const callback = this.onSocketValueEvents.get(socket_key);
		if (!callback) {
			console.log(this.possibleIDs, callback);
			throw new Error(`No callback registered for socket ${socket_key}`);
		}

		this.setSockets.add(socket_key);
		const promise = callback(value);
		this.socketPromises.set(socket_key, promise);

		if (this.setSockets.size === this.possibleIDs.size) {
			// All sockets have been set, wait for all callbacks to resolve
			await Promise.all([...this.socketPromises.values()]);
			this.resolveAllSet(); // resolve the allSocketsSetPromise
		}
	}

	// Returns a promise that resolves when all sockets have been set and their callbacks resolved
	waitForAllSocketsSet(): Promise<void> {
		return this.allSocketsSetPromise;
	}
}

export type UserFunction = (
	inputs: Record<string, unknown>,
	outputs: OutputSocketDataCollection,
	utils: Record<string, unknown>
) => Promise<void>;

export const userFunctionAllowedModules = {
	log: (...args: unknown[]) => console.log('[User Log]', ...args),
	NodeLibManager: NodeAPIConnectorManager,
	Jimp
};

async function executeNode(nid: string, inputs: Record<string, unknown>): Promise<OutputSocketDataCollection> {
	const nodeBluePrint = new FirestoreNodeBluePrintController(nid);
	const outputs = new OutputSocketDataCollection(new Set(await nodeBluePrint.getOutputSocketKeysInOrder()));
	const inputsMap = new Map<string, unknown>();
	Object.entries(inputs).forEach(([key, value]) => {
		inputsMap.set(key, value);
	});
	await nodeBluePrint.call(inputsMap, outputs);
	return outputs;
}

export function executeStartingAtNode(nodes: Node[], edges: Edge[], startNodeId: string) {
	// Create maps for quick lookups
	const nodeMap = new Map(nodes.map(node => [node.id, node]));
	const incomingEdges = new Map<string, Edge[]>(); // nodeId -> edges coming into it
	const outgoingEdges = new Map<string, Edge[]>(); // nodeId -> edges going out of it

	// Build edge maps
	edges.forEach(edge => {
		if (!incomingEdges.has(edge.target)) {
			incomingEdges.set(edge.target, []);
		}
		if (!outgoingEdges.has(edge.source)) {
			outgoingEdges.set(edge.source, []);
		}
		incomingEdges.get(edge.target)!.push(edge);
		outgoingEdges.get(edge.source)!.push(edge);
	});

	// Find all nodes that need to be executed (reverse BFS from startNode)
	const nodesToExecute = new Set<string>();
	const queue = [startNodeId];
	const visited = new Set<string>();

	while (queue.length > 0) {
		const currentNodeId = queue.shift()!;
		if (visited.has(currentNodeId)) continue;

		visited.add(currentNodeId);
		nodesToExecute.add(currentNodeId);

		// Add all dependencies (nodes that have edges pointing to current node)
		const incoming = incomingEdges.get(currentNodeId) || [];
		incoming.forEach(edge => {
			if (!visited.has(edge.source)) {
				queue.push(edge.source);
			}
		});
	}

	// Track execution state
	const executingNodes = new Map<string, OutputSocketDataCollection>();
	const completedNodes = new Set<string>();
	const socketValues = new Map<string, unknown>(); // socketKey -> value

	// Check if a node's dependencies are satisfied
	function canExecuteNode(nodeId: string): boolean {
		const incoming = incomingEdges.get(nodeId) || [];
		return incoming.every(edge => {
			const socketKey = `${edge.source}:${edge.sourceHandle}`;
			return socketValues.has(socketKey);
		});
	}

	// Get required input data for a node
	function getNodeInputData(nodeId: string): Record<string, unknown> {
		const node = nodeMap.get(nodeId)!;
		const incoming = incomingEdges.get(nodeId) || [];
		const inputData: Record<string, unknown> = {};

		incoming.forEach((edge: Edge) => {
			const socketKey = `${edge.source}:${edge.sourceHandle}`;
			if (socketValues.has(socketKey) && edge.targetHandle) {
				// Map the output socket to the target input socket
				inputData[edge.targetHandle] = socketValues.get(socketKey);
			}
		});

		return inputData;
	}

	// Execute a node and set up listeners for its outputs
	async function executeNodeAsync(nodeId: string) {
		if (executingNodes.has(nodeId) || completedNodes.has(nodeId)) {
			return;
		}

		const node = nodeMap.get(nodeId)!;
		const inputData = getNodeInputData(nodeId);

		console.log(`Executing node ${nodeId}`);
		if (!node.data || !node.data.nid)
			throw new Error(`Node ${nodeId} not executable; no data.nid entry.`);
		const outputCollection = await executeNode(node.data.nid as string, inputData);
		executingNodes.set(nodeId, outputCollection);

		// Set up listeners for each output socket
		const outgoing = outgoingEdges.get(nodeId) || [];
		const outputSockets = new Set(outgoing.map(edge => edge.sourceHandle));

		outputSockets.forEach(socketId => {
			if (socketId) {
				outputCollection.on(socketId, async (value: unknown) => {
					const socketKey = `${nodeId}:${socketId}`;
					socketValues.set(socketKey, value);
					console.log(`Socket ${socketKey} ready with value`);

					// Check if any dependent nodes can now be executed
					const dependentNodes = outgoing
						.filter(edge => edge.sourceHandle === socketId)
						.map(edge => edge.target);

					for (const dependentNodeId of dependentNodes) {
						if (nodesToExecute.has(dependentNodeId) && canExecuteNode(dependentNodeId)) {
							executeNodeAsync(dependentNodeId);
						}
					}
				});
			}
		});

		// Wait for completion and mark as done
		try {
			await outputCollection.waitForAllSocketsSet();
			executingNodes.delete(nodeId);
			completedNodes.add(nodeId);
			console.log(`Node ${nodeId} completed`);
		} catch (error) {
			console.error(`Node ${nodeId} failed:`, error);
			executingNodes.delete(nodeId);
		}
	}

	// Start execution with nodes that have no dependencies
	const initialNodes = Array.from(nodesToExecute).filter(nodeId => {
		const incoming = incomingEdges.get(nodeId) || [];
		return incoming.length === 0;
	});

	console.log(`Starting execution with ${initialNodes.length} initial nodes:`, initialNodes);

	// Execute initial nodes
	initialNodes.forEach(nodeId => {
		executeNodeAsync(nodeId);
	});

	// Return a promise that resolves when the start node is complete
	return new Promise<void>((resolve, reject) => {
		const checkCompletion = () => {
			if (completedNodes.has(startNodeId)) {
				resolve();
			} else {
				// Check again after a short delay
				setTimeout(checkCompletion, 10);
			}
		};
		checkCompletion();
	});
}

function propagateNodeOutput(source: string, sourceHandle: string, output: Record<string, unknown>, nodes: Node[], edges: Edge[]) {

	const nodeMap: Map<string, number> = new Map(
		nodes.map((node, index) => [node.id, index])
	);

	// Build edge maps
	edges.forEach(edge => {
		if (edge.source==source) { // edges leaving this node
			const toNodeIdx = nodeMap.get(edge.target);
			const fromNodeIdx = nodeMap.get(source);
			if (toNodeIdx && fromNodeIdx) {
				// TODO: check if socket value actually needs updating here.
				// @ts-ignore
				nodes[toNodeIdx].data.input[edge.sourceHandle] = nodes[fromNodeIdx].data.input[sourceHandle];
			} else {
				console.log(`Missing a node: ${edge.target}==${toNodeIdx} ==> ${source}==${fromNodeIdx}`);
			}
		}
	});
}
