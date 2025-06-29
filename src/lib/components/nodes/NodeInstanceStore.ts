import {writable, derived, type Writable, type Readable, readable, get} from 'svelte/store';
import {type NodeConnection, useNodeConnections, useNodesData, useSvelteFlow} from '@xyflow/svelte';
import {projectActions, projectComputedDataCache} from '$lib/stores/ProjectState';
import type {Unsubscribe} from "firebase/firestore";
import { docStore } from 'sveltefire';
import { firestore } from '../../../firebase';
import type { FirestoreNodeBluePrintModel } from '$lib/compositor/nodes/firestore/FirestoreNodeBluePrint';
import {type Node} from "@xyflow/svelte";
import type {ExecutionStatus} from "$lib/compositor/ComputedDataCache";

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
    public inputConnections: Readable<{readonly current: NodeConnection[]}>;
    public nodeData: Readable<{current: Pick<Node, "id" | "data" | "type"> | null}>;
    public readonly nid: string;
    public hasError: Writable<boolean>;
    public errorMessage: Writable<string>;

    // Node blueprint store
    public nodeBluePrint;
    public executionStatus: Readable<ExecutionStatus | undefined>;

    private unsubscribers: Unsubscribe[] = [];

    constructor(nodeId: string) {
        this.nodeId = nodeId;

        // Initialize connection management
        this.inputConnections = readable(useNodeConnections({ id: this.nodeId, handleType: 'target' }));

        this.nodeData = readable(useNodesData(this.nodeId));

        // get nid
        const nodeDataSnapshot = get(this.nodeData);
        if (!nodeDataSnapshot.current)
            throw new Error(`No node data found for ${this.nodeId}`);
        // nid is a required attribute of data
        if (!nodeDataSnapshot.current.data.nid)
            throw new Error(`No nid found for ${this.nodeId}`);
        this.nid = nodeDataSnapshot.current.data.nid as string;

        // Error handling stores
        this.hasError = writable(false);
        this.errorMessage = writable('');
        this.executionStatus = projectComputedDataCache.useNodeExecutionStatusStore(this.nodeId);

        // Initialize blueprint if nid is provided
        this.nodeBluePrint = docStore<FirestoreNodeBluePrintModel>(firestore, `nodes/${this.nid}`);

        // Subscribe to error socket and execution status
        this.setupInputSockets();
    }

    /**
     * Ensure node data has all input sockets with default values, error messages, and more
     */
    setupInputSockets(): void {
        if (!this.nodeBluePrint)
            throw new Error(`No nodeBluePrint found for ${this.nodeId}`);

        const unsubscribe = this.nodeBluePrint.subscribe((blueprint) => {

            const unsubscribe = this.nodeData.subscribe(($nodeData) => {

                if (!$nodeData.current)
                    throw new Error(`No node data found for ${this.nodeId}`);

                const nodeData = $nodeData.current.data as Record<string, unknown>;
                const input = (nodeData.input || {}) as Record<string, unknown>;

                if (blueprint?.input_sockets) {
                    blueprint.input_socket_order.forEach((socketId) => {
                        if (!input[socketId]) {
                            input[socketId] = blueprint.input_sockets[socketId].params.default_value;
                        }
                    });
                }

                this.updateData(
                    { input:input }
                );

            });

            return unsubscribe; // destroy callback for updating upon call to change blueprint.
        });

        if (unsubscribe)
            this.unsubscribers.push(unsubscribe);
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
        const nodeData = get(this.nodeData);
        if (nodeData.current) {
            (nodeData.current.data.input as Record<string, unknown>)[socketId] = value;
            projectActions.updateNodeData(
                this.nodeId,
                {
                    input: nodeData.current.data.input
                }
            );
        }
    }

    /**
     * Creates a reactive subscription to a connected input socket
     * Returns a readable store with the socket data
     */
    inputSocketStore(socketId: string): Readable<InputSocketState> {
        return derived(
            this.inputConnections,
            (connections, set) => {

                const connection = connections.current.find( connection => {
                    return connection.targetHandle == socketId // && connection.target === this.nodeId
                });

                if (!connection) { // reactively get data from the node.data.input[socketId]

                    const unsubscribe = this.nodeData.subscribe(($nodeData) => {

                        const socketState = new (class extends InputSocketState {
                            get isConnected(): boolean {
                                return false;
                            }

                            update(newValue: unknown): void {
                                this.getNode().updateDataInputSocket(socketId, newValue);
                            }

                            get value(): unknown {
                                return ($nodeData.current?.data.input as Record<string, unknown>)[socketId];
                            }

                        })(this);

                        set(socketState);
                    });
                    return unsubscribe;
                }

                const source = connection.source;
                const sourceHandle = connection.sourceHandle;

                if (sourceHandle) { // reactively get data from the linked socket
                    const unsubscribe = projectComputedDataCache.useSocketStore(
                        source,
                        sourceHandle
                    ).subscribe((socketData) => {

                        const socketState = new (class extends InputSocketState {
                            get isConnected(): boolean {
                                return true;
                            }

                            update(newValue: unknown): void {
                                throw new Error(`You cannot modify a connected socket's value: tried to update ${socketId} on ${this.getNode().nodeId}`);
                            }

                            get value(): unknown {
                                return socketData;
                            }

                        })(this);

                        set(socketState);
                    });
                    return unsubscribe;
                }
            }
        );
    }



    /**
     * Cleanup method to unsubscribe from all listeners
     */
    cleanup(): void {
        // This would contain cleanup logic for subscriptions
        // Implementation depends on how subscriptions are managed
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
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

// /**
//  * Utility type for node data with standardized input
//  */
// export interface NodeState<T extends Record<string, any> = {}> {
//     input: T;
//     nid: string;
//     errorMessage?: string;
// }