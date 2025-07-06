import {
    derived,
    type Readable,
    readable,
    get,
} from 'svelte/store';
import { type NodeConnection, useNodeConnections } from '@xyflow/svelte';
import {
    projectActions,
    projectComputedDataCache,
    projectNodes,
} from '$lib/stores/ProjectState';
import type { Unsubscribe } from 'firebase/firestore';
import { type Node } from '@xyflow/svelte';
import type { ExecutionStatus } from '$lib/compositor/ComputedDataCache';
import {createNodeBluePrintStore} from "$lib/compositor/NodeBluePrint";
import type {FirestoreNodeBluePrintModel} from "$shared/NodeBluePrintModel";

export abstract class InputSocketState {
    private readonly node: NodeInstanceStore;
    constructor(node: NodeInstanceStore) {
        this.node = node;
    }
    abstract get value(): unknown;
    abstract get isConnected(): boolean;
    get isEditable(): boolean {
        return !this.isConnected;
    }
    getNode() {
        return this.node;
    }
    abstract update(newValue: unknown): void;
}

/**
 * Reactive stores and utilities for node components
 * Centralizes common patterns used across all node implementations
 */
export class NodeInstanceStore {
    readonly nodeId: string;

    // Core reactive stores
    public inputConnections: Readable<{ readonly current: NodeConnection[] }>;
    public nodeStore: Readable<Node | undefined>;
    public nodeInputDataStore: Readable<Record<string, unknown>>;
    public nid: Readable<string | undefined>;

    // Node blueprint store
    public nodeBluePrint: Readable<FirestoreNodeBluePrintModel | undefined>;
    public executionStatus: Readable<ExecutionStatus | undefined>;

    private unsubscribers: Unsubscribe[] = [];

    constructor(nodeId: string) {
        this.nodeId = nodeId;

        // Create a periodic check for edge changes (fallback approach)
        // this bs is the result of sveltflow breaking reactivity FOR ABSOLUTELY NO FUCKING REASON
        const inputConnections = useNodeConnections({
            id: this.nodeId,
            handleType: 'target',
        });
        let lastConnectionsHash: string | null = null;
        this.inputConnections = readable(
            JSON.parse(JSON.stringify(inputConnections)),
            (set) => {
                const interval = setInterval(() => {
                    const connectionsHash = JSON.stringify(inputConnections);
                    if (connectionsHash !== lastConnectionsHash) {
                        lastConnectionsHash = connectionsHash;
                        set(JSON.parse(connectionsHash));
                    }
                }, 100);

                return () => clearInterval(interval);
            }
        );

        // set up node data store with hash-based comparison to prevent reactive loops
        let lastNodeHash: string | null = null;
        this.nodeStore = derived(projectNodes, ($nodes, set) => {
            const node = $nodes.find((node) => node.id === this.nodeId);
            const nodeHash = node ? JSON.stringify(node) : null;

            // Only update if the hash has actually changed
            if (nodeHash !== lastNodeHash) {
                lastNodeHash = nodeHash;
                set(node);
            }
        });

        let lastInputDataHash: string | null = null;
        this.nodeInputDataStore = derived(this.nodeStore, ($nodeStore, set) => {
            const inputData = ($nodeStore?.data.input || {}) as Record<
                string,
                unknown
            >;
            const inputDataHash = JSON.stringify(inputData);

            // Only update if the hash has actually changed
            if (inputDataHash !== lastInputDataHash) {
                lastInputDataHash = inputDataHash;
                set(inputData);
            }
        });

        this.nid = derived(
            this.nodeStore,
            ($nodeStore) => ($nodeStore?.data.nid as string) || undefined
        );

        // Error handling stores
        this.executionStatus =
            projectComputedDataCache.useNodeExecutionStatusStore(this.nodeId);

        // Initialize blueprint if nid is provided
        this.nodeBluePrint = derived(this.nid, ($nid, set) => {
            if ($nid) {
                return createNodeBluePrintStore($nid).subscribe((blueprint) => {
                    set(blueprint);
                });
            }
            set(undefined);
        });

        // Subscribe to error socket and execution status
        this.setupInputSockets();
    }

    /**
     * Ensure node data has all input sockets with default values, error messages, and more
     */
    setupInputSockets(): void {
        if (!this.nodeBluePrint)
            throw new Error(`No nodeBluePrint found for ${this.nodeId}`);

        const unsubscribe = this.nodeBluePrint.subscribe((blueprint: FirestoreNodeBluePrintModel | undefined) => {
            if (!blueprint) return;

            const unsubscribe = this.nodeInputDataStore.subscribe(
                ($nodeInputDataStore) => {
                    if (!$nodeInputDataStore)
                        throw new Error(
                            `No node data found for ${this.nodeId}`
                        );

                    const newInput: Record<string, unknown> = {};
                    let updated = false;

                    if (blueprint.input_sockets) {
                        blueprint.input_socket_order.forEach((socketId) => {
                            if (
                                !Object.keys($nodeInputDataStore).includes(
                                    socketId
                                )
                            ) {
                                newInput[socketId] =
                                    blueprint.input_sockets[
                                        socketId
                                    ].params.default_value;
                                updated = true;
                            }
                        });
                    }

                    if (updated) {
                        this.updateData({ input: newInput });
                    }
                }
            );

            return unsubscribe; // destroy callback for updating upon call to change blueprint.
        });

        if (unsubscribe) this.unsubscribers.push(unsubscribe);
    }

    /**
     * Updates node data using projectActions (preferred method)
     */
    updateData(data: Record<string, unknown>): void {
        // projectActions.
        // const { updateNodeData } = useSvelteFlow();
        // updateNodeData(this.nodeId, data);
        projectActions.updateNodeData(this.nodeId, data);
    }

    updateDataInputSocket(socketId: string, value: unknown): void {
        const nodeInputDataStore = get(this.nodeInputDataStore);
        if (nodeInputDataStore) {
            nodeInputDataStore[socketId] = value;
            projectActions.updateNodeData(this.nodeId, {
                input: nodeInputDataStore,
            });
        }
    }

    private subscribeToInputSocketState(
        connections: NodeConnection[],
        socketId: string,
        set: (value: InputSocketState) => void
    ): Unsubscribe {
        const connection = connections.find((connection) => {
            return connection.targetHandle == socketId; // && connection.target === this.nodeId
        });

        if (!connection) {
            // reactively get data from the node.data.input[socketId]

            const unsubscribe = this.nodeInputDataStore.subscribe(
                ($nodeInputDataStore) => {
                    const socketState = new (class extends InputSocketState {
                        get isConnected(): boolean {
                            return false;
                        }

                        update(newValue: unknown): void {
                            this.getNode().updateDataInputSocket(
                                socketId,
                                newValue
                            );
                        }

                        get value(): unknown {
                            return $nodeInputDataStore[socketId] || null;
                        }
                    })(this);

                    set(socketState);
                }
            );
            return unsubscribe;
        }

        const source = connection.source;
        const sourceHandle = connection.sourceHandle;

        if (sourceHandle) {
            // reactively get data from the linked socket
            const unsubscribe = projectComputedDataCache
                .useSocketStore(source, sourceHandle)
                .subscribe((socketData) => {
                    const socketState = new (class extends InputSocketState {
                        get isConnected(): boolean {
                            return true;
                        }

                        update(newValue: unknown): void {
                            throw new Error(
                                `You cannot modify a connected socket's value: tried to update ${socketId} on ${this.getNode().nodeId}`
                            );
                        }

                        get value(): unknown {
                            return socketData;
                        }
                    })(this);

                    set(socketState);
                });
            return unsubscribe;
        }

        throw new Error(`No node connection or data found for ${this.nodeId}`);
    }

    /**
     * Creates a reactive subscription to a connected input socket
     * Returns a readable store with the socket data
     */
    inputSocketStore(socketId: string): Readable<InputSocketState> {
        return derived(this.inputConnections, (connections, set) => {
            return this.subscribeToInputSocketState(
                connections.current,
                socketId,
                set
            );
        });
    }

    allInputSocketsStore(): Readable<Map<string, InputSocketState>> {
        return derived(
            [this.inputConnections, this.nodeBluePrint],
            ([$connections, $nodeBluePrint], set) => {
                const socketStates: Map<string, InputSocketState> = new Map();
                const unsubscribers: Unsubscribe[] = [];

                if (!$nodeBluePrint) {
                    return;
                }

                $nodeBluePrint.input_socket_order.map((socketId: string) => {
                    function returnSocketState(socket: InputSocketState) {
                        socketStates.set(socketId, socket);
                    }
                    unsubscribers.push(
                        this.subscribeToInputSocketState(
                            $connections.current,
                            socketId,
                            returnSocketState
                        )
                    );
                });

                set(socketStates);

                return () => {
                    unsubscribers.forEach((unsubscribe) => unsubscribe());
                };
            }
        );
    }

    /**
     * Cleanup method to unsubscribe from all listeners
     */
    cleanup(): void {
        // This would contain cleanup logic for subscriptions
        // Implementation depends on how subscriptions are managed
        this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    }

    destroy(): void {
        this.cleanup();
    }
}

/**
 * Factory function to create a NodeStore instance
 * This is the main entry point for node components
 */
export function createNodeStore(nodeId: string): NodeInstanceStore {
    return new NodeInstanceStore(nodeId);
}

/**
 * Utility type for node data with standardized input
 */
export interface NodeState extends Record<string, unknown> {
    nid: string;
    input: Record<string, unknown>;
    errorMessage: string;
}

export type NodeStoreType = Node<NodeState, 'node-store'>;
