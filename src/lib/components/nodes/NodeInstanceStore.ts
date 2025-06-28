import {writable, derived, type Writable, type Readable, readable} from 'svelte/store';
import {type NodeConnection, useNodeConnections, useNodesData, useSvelteFlow} from '@xyflow/svelte';
import { projectComputedDataCache } from '$lib/stores/ProjectState';
import type {Unsubscribe} from "firebase/firestore";
import { docStore } from 'sveltefire';
import { firestore } from '../../../firebase';
import type { FirestoreNodeBluePrintModel } from '$lib/compositor/nodes/firestore/FirestoreNodeBluePrint';

const { updateNodeData } = useSvelteFlow();

/**
 * Reactive stores and utilities for node components
 * Centralizes common patterns used across all node implementations
 */
export class NodeInstanceStore {
    private nodeId: string;

    // Core reactive stores
    public inputConnections: Readable<{readonly current: NodeConnection[]}>;
    public hasInputConnection: Readable<boolean>;
    public nodeData;
    public readonly nid: string;
    public hasError: Writable<boolean>;
    public errorMessage: Writable<string>;

    // Node blueprint store
    public nodeBluePrint;
    public executionTime: Writable<number>;

    private unsubscribers: Unsubscribe[] = [];

    constructor(nodeId: string) {
        this.nodeId = nodeId;

        // Initialize connection management
        this.inputConnections = readable(useNodeConnections({ id: this.nodeId, handleType: 'target' }));
        this.hasInputConnection = derived(this.inputConnections, (connections) =>
            connections.current.length > 0
        );

        this.nodeData = useNodesData(this.nodeId);
        if (!this.nodeData.current)
            throw new Error(`No node data found for ${this.nodeId}`);

        // nid is a required attribute of data
        if (!this.nodeData.current.data.nid)
            throw new Error(`No nid found for ${this.nodeId}`);
        this.nid = this.nodeData.current.data.nid as string;

        // Error handling stores
        this.hasError = writable(false);
        this.errorMessage = writable('');
        this.executionTime = writable(0);

        // Initialize blueprint if nid is provided
        this.nodeBluePrint = docStore<FirestoreNodeBluePrintModel>(firestore, `nodes/${this.nid}`);

        // Subscribe to error socket and execution status
        this.setupInputSockets();
        this.setupErrorHandling();
        this.setupExecutionTimeTracking();
    }

    /**
     * Ensure node data has all input sockets with default values, error messages, and more
     */
    setupInputSockets(): void {
        if (!this.nodeBluePrint)
            throw new Error(`No nodeBluePrint found for ${this.nodeId}`);

        this.nodeBluePrint.subscribe((blueprint) => {

            if (!this.nodeData.current)
                throw new Error(`No node data found for ${this.nodeId}`);

            const nodeData = this.nodeData.current.data as Record<string, unknown>;
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
    }

    /**
     * Sets up error handling subscription for the node
     */
    private setupErrorHandling(): void {
        const unsubscribeError = projectComputedDataCache
            .useNodeErrorStore(this.nodeId)
            .subscribe((socketData) => {
            if (socketData) {
                this.hasError.set(true);
                this.errorMessage.set(String(socketData));
                this.updateData({ errorMessage: String(socketData) });
            } else {
                this.hasError.set(false);
                this.errorMessage.set('');
            }
        });
        this.unsubscribers.push(unsubscribeError);
    }

    /**
     * Sets up execution time tracking subscription
     */
    private setupExecutionTimeTracking(): void {
        const unsubscribeExecution = projectComputedDataCache
            .useNodeExecutionStatusStore(this.nodeId)
            .subscribe(
            (executionStatus) => {
                if (executionStatus !== undefined && executionStatus !== null && typeof executionStatus === "string") {
                    const executionStatusString: string = executionStatus as string;
                    const executedAtPrefix = 'Executed at ';
                    if (executionStatusString.startsWith(executedAtPrefix)) {
                        const executionTimeMs = Date.now() - parseInt(executionStatusString.substring(executedAtPrefix.length));
                        this.executionTime.set(executionTimeMs);
                    } else if (executionStatusString === 'idle') {
                        this.executionTime.set(0);
                    }
                } else {
                    console.warn(`Received invalid execution status`, executionStatus);
                }
            }
        );
        this.unsubscribers.push(unsubscribeExecution);
    }

    /**
     * Updates node data using projectActions (preferred method)
     */
    updateData(data: Record<string, unknown>): void {
        // projectActions.
        updateNodeData(this.nodeId, data);
    }

    /**
     * Creates a reactive subscription to a connected input socket
     * Returns a readable store with the socket data
     */
    inputSocketStore(socketId: string): Readable<any> {
        return derived(
            [this.inputConnections, this.hasInputConnection],
            ([connections, hasConnection], set) => {
                if (!hasConnection || connections.current.length === 0) {
                    set(null);
                    return;
                }

                const connection = connections.current.find( connection => {
                    return connection.targetHandle == socketId && connection.target === this.nodeId
                });

                if (!connection) {
                    set(null);
                    return;
                }

                const source = connection.source;
                const sourceHandle = connection.sourceHandle;

                if (sourceHandle) {
                    const unsubscribe = projectComputedDataCache.useSocketStore(
                        source,
                        sourceHandle
                    ).subscribe((socketData) => {
                        set(socketData);
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