/**
 * This extensive test suite validates the ComputedDataCache system, which provides reactive state management for node execution data, execution logging, and execution status tracking with Svelte store integration. The cache manages socket data, node-level execution states with logs, execution lifecycle tracking, and provides reactive interfaces for UI components to monitor computation progress and results in real-time.
 * 
 * Test categories:
 * • Error Handling Reactivity (useNodeExecutionStatusStore) - Tests reactive execution status tracking with error logging, multi-node execution isolation, log persistence during execution lifecycle, and various error log types
 * • Execution Status Functions - Validates execution lifecycle tracking with start/finish timestamps, reactive status updates, error handling for invalid state transitions, multiple execution cycles, and cross-node execution independence
 * • Integration: Error Handling + Execution Status - Tests coordinated error logging and execution state management, status persistence during errors, and cleanup behavior during node dumping
 * • Basic Operations - Validates core cache functionality including data storage/retrieval, existence checking, data updates, removal operations, and cache clearing
 * • Node Operations - Tests node-specific operations like dumping all node caches and proper cleanup
 * • Reactive Stores - Verifies reactive socket stores, hasSocketData stores, node-specific data stores, and global data store functionality
 * • Store Reactivity - Tests reactive updates during data changes, proper subscriber notifications, and real-time state synchronization
 * • Edge Cases - Validates handling of null/undefined values, complex object data, special characters in IDs, and boundary conditions
 * • Performance - Tests efficient handling of large data sets, concurrent operations, and response time requirements
 * • Memory Management - Verifies proper cleanup during cache clearing and store update efficiency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { ComputedDataCache, type ExecutionStatus } from './ComputedDataCache';
import {OutputSocketAsyncReturner} from "$lib/compositor/NodeEnvironment";

describe('ComputedDataCache', () => {
    let cache: ComputedDataCache;

    beforeEach(() => {
        cache = new ComputedDataCache();
    });

    describe('Error Handling Reactivity (useNodeExecutionStatusStore)', () => {
        it('should reactively track error messages via useNodeExecutionStatusStore', async () => {
            const statusStore = cache.useNodeExecutionStatusStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = statusStore.subscribe(mockSubscriber);

            // Initially should be undefined (no execution)
            expect(mockSubscriber).toHaveBeenCalledWith(undefined);
            expect(get(statusStore)).toBeUndefined();

            // Start execution to initialize status
            cache.nodeExecutionStarted('test-node');
            const initialStatus = get(statusStore) as ExecutionStatus;
            expect(initialStatus.logs).toEqual([]);

            // Log an error message
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'Test error message');

            // Should trigger reactivity and update the status store
            const statusWithError = get(statusStore) as ExecutionStatus;
            expect(statusWithError.logs).toHaveLength(1);
            expect(statusWithError.logs[0]).toEqual([{ type: 'error' }, 'Test error message']);

            // Add another error message
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'Updated error message');
            const statusWithTwoErrors = get(statusStore) as ExecutionStatus;
            expect(statusWithTwoErrors.logs).toHaveLength(2);
            expect(statusWithTwoErrors.logs[1]).toEqual([{ type: 'error' }, 'Updated error message']);

            // Clear the execution status
            await cache.dumpNodeCaches('test-node');
            expect(get(statusStore)).toBeUndefined();

            unsubscribe();
        });

        it('should handle error logging during execution lifecycle', async () => {
            const outputKeys = new Set(['output1', 'output2']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const statusStore = cache.useNodeExecutionStatusStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = statusStore.subscribe(mockSubscriber);

            // Initially should be undefined
            expect(mockSubscriber).toHaveBeenCalledWith(undefined);

            // Start execution
            cache.nodeExecutionStarted('test-node');
            const initialStatus = get(statusStore) as ExecutionStatus;
            expect(initialStatus.logs).toEqual([]);

            // Log errors directly
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'Connection timeout error');

            // Should update status store reactively
            const statusWithError = get(statusStore) as ExecutionStatus;
            expect(statusWithError.logs).toHaveLength(1);
            expect(statusWithError.logs[0]).toEqual([{ type: 'error' }, 'Connection timeout error']);

            // Log another error
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'Validation failed');
            const statusWithTwoErrors = get(statusStore) as ExecutionStatus;
            expect(statusWithTwoErrors.logs).toHaveLength(2);
            expect(statusWithTwoErrors.logs[1]).toEqual([{ type: 'error' }, 'Validation failed']);

            unsubscribe();
        });

        it('should handle multiple nodes with separate execution status stores', async () => {
            const outputKeys = new Set(['output1']);
            const returner1 = new OutputSocketAsyncReturner(
                cache,
                'node-1',
                outputKeys
            );
            const returner2 = new OutputSocketAsyncReturner(
                cache,
                'node-2',
                outputKeys
            );

            const statusStore1 = cache.useNodeExecutionStatusStore('node-1');
            const statusStore2 = cache.useNodeExecutionStatusStore('node-2');

            // Start execution for both nodes
            cache.nodeExecutionStarted('node-1');
            cache.nodeExecutionStarted('node-2');

            // Log errors for different nodes
            cache.nodeExecutionLog('node-1', { type: 'error' }, 'Error from node 1');
            cache.nodeExecutionLog('node-2', { type: 'error' }, 'Error from node 2');

            // Each status store should only contain its own node's logs
            const status1 = get(statusStore1) as ExecutionStatus;
            const status2 = get(statusStore2) as ExecutionStatus;
            expect(status1.logs).toEqual([[{ type: 'error' }, 'Error from node 1']]);
            expect(status2.logs).toEqual([[{ type: 'error' }, 'Error from node 2']]);

            // Clear one node's status shouldn't affect the other
            await cache.dumpNodeCaches('node-1');
            expect(get(statusStore1)).toBeUndefined();
            const status2After = get(statusStore2) as ExecutionStatus;
            expect(status2After.logs).toEqual([[{ type: 'error' }, 'Error from node 2']]);
        });

        it('should handle execution status reactivity when node caches are dumped', async () => {
            const outputKeys = new Set(['output1']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const statusStore = cache.useNodeExecutionStatusStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = statusStore.subscribe(mockSubscriber);

            // Start execution and log error and set some regular data
            cache.nodeExecutionStarted('test-node');
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'Initial error');
            await cache.cache('test-node', 'output1', 'some data');

            const statusWithError = get(statusStore) as ExecutionStatus;
            expect(statusWithError.logs).toEqual([[{ type: 'error' }, 'Initial error']]);

            // Dump all node caches
            await cache.dumpNodeCaches('test-node');

            // Execution status should be cleared
            expect(get(statusStore)).toBeUndefined();

            unsubscribe();
        });

        it('should handle different error log types', async () => {
            const statusStore = cache.useNodeExecutionStatusStore('test-node');

            // Start execution
            cache.nodeExecutionStarted('test-node');

            // String error
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'String error');
            let status = get(statusStore) as ExecutionStatus;
            expect(status.logs[0]).toEqual([{ type: 'error' }, 'String error']);

            // Object context
            cache.nodeExecutionLog('test-node', { type: 'error', code: 404 }, 'Not found');
            status = get(statusStore) as ExecutionStatus;
            expect(status.logs[1]).toEqual([{ type: 'error', code: 404 }, 'Not found']);

            // Complex context
            cache.nodeExecutionLog('test-node', { 
                type: 'error', 
                details: { path: '/api/test' } 
            }, 'API error');
            status = get(statusStore) as ExecutionStatus;
            expect(status.logs[2]).toEqual([{ 
                type: 'error', 
                details: { path: '/api/test' } 
            }, 'API error']);

            // Different log types
            cache.nodeExecutionLog('test-node', { type: 'warning' }, 'Warning message');
            status = get(statusStore) as ExecutionStatus;
            expect(status.logs[3]).toEqual([{ type: 'warning' }, 'Warning message']);
        });
    });

    describe('Execution Status Functions', () => {
        it('should track execution status through start and finish lifecycle', async () => {
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = executionStore.subscribe(mockSubscriber);

            // Initially should be undefined
            expect(mockSubscriber).toHaveBeenCalledWith(undefined);
            expect(get(executionStore)).toBeUndefined();

            // Start execution
            const startTime = new Date();
            cache.nodeExecutionStarted('test-node');

            const startStatus = get(executionStore) as ExecutionStatus;
            expect(startStatus).toHaveProperty('startedAt');
            expect(startStatus).toHaveProperty('stoppedAt');
            expect(startStatus.startedAt).toBeInstanceOf(Date);
            expect(startStatus.startedAt.getTime()).toBeGreaterThanOrEqual(
                startTime.getTime()
            );
            expect(startStatus.stoppedAt).toBeUndefined();

            // Finish execution
            const finishTime = new Date();
            cache.nodeExecutionFinished('test-node');

            const finishStatus = get(executionStore) as ExecutionStatus;
            expect(finishStatus).toHaveProperty('startedAt');
            expect(finishStatus).toHaveProperty('stoppedAt');
            expect(finishStatus.stoppedAt).toBeInstanceOf(Date);
            expect(finishStatus.stoppedAt!.getTime()).toBeGreaterThanOrEqual(
                finishTime.getTime()
            );
            expect(finishStatus.startedAt).toBe(startStatus.startedAt); // Should preserve start time

            unsubscribe();
        });

        it('should reactively update execution status store', async () => {
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = executionStore.subscribe(mockSubscriber);

            // Should start with undefined
            expect(mockSubscriber).toHaveBeenCalledWith(undefined);

            // Start execution should trigger update
            cache.nodeExecutionStarted('test-node');
            expect(mockSubscriber).toHaveBeenCalledTimes(2);

            const startCall = mockSubscriber.mock
                .calls[1][0] as ExecutionStatus;
            expect(startCall).toHaveProperty('startedAt');
            expect(startCall.stoppedAt).toBeUndefined();

            // Finish execution should trigger update
            cache.nodeExecutionFinished('test-node');
            expect(mockSubscriber).toHaveBeenCalledTimes(3);

            const finishCall = mockSubscriber.mock
                .calls[2][0] as ExecutionStatus;
            expect(finishCall).toHaveProperty('startedAt');
            expect(finishCall).toHaveProperty('stoppedAt');
            expect(finishCall.stoppedAt).toBeInstanceOf(Date);

            unsubscribe();
        });

        it('should throw error when finishing execution that was never started', () => {
            expect(() => {
                cache.nodeExecutionFinished('never-started-node');
            }).toThrow(
                'Node was never executed so cannot have finished executing.'
            );
        });

        it('should handle multiple execution cycles for the same node', async () => {
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');

            // First execution cycle
            cache.nodeExecutionStarted('test-node');
            const firstStart = get(executionStore) as ExecutionStatus;

            cache.nodeExecutionFinished('test-node');
            const firstFinish = get(executionStore) as ExecutionStatus;

            expect(firstFinish.stoppedAt).toBeInstanceOf(Date);

            // Wait a bit to ensure time difference
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Second execution cycle
            cache.nodeExecutionStarted('test-node');
            const secondStart = get(executionStore) as ExecutionStatus;

            // Should have a new start time
            expect(secondStart.startedAt.getTime()).toBeGreaterThan(
                firstStart.startedAt.getTime()
            );
            expect(secondStart.stoppedAt).toBeUndefined();

            cache.nodeExecutionFinished('test-node');
            const secondFinish = get(executionStore) as ExecutionStatus;

            expect(secondFinish.stoppedAt).toBeInstanceOf(Date);
            expect(secondFinish.startedAt).toBe(secondStart.startedAt);
        });

        it('should handle execution status for multiple libs independently', async () => {
            const executionStore1 = cache.useNodeExecutionStatusStore('node-1');
            const executionStore2 = cache.useNodeExecutionStatusStore('node-2');

            // Start execution for both libs
            cache.nodeExecutionStarted('node-1');
            cache.nodeExecutionStarted('node-2');

            const status1 = get(executionStore1) as ExecutionStatus;
            const status2 = get(executionStore2) as ExecutionStatus;

            expect(status1.startedAt).toBeInstanceOf(Date);
            expect(status2.startedAt).toBeInstanceOf(Date);
            expect(status1.stoppedAt).toBeUndefined();
            expect(status2.stoppedAt).toBeUndefined();

            // Finish only node-1
            cache.nodeExecutionFinished('node-1');

            const updatedStatus1 = get(executionStore1) as ExecutionStatus;
            const updatedStatus2 = get(executionStore2) as ExecutionStatus;

            expect(updatedStatus1.stoppedAt).toBeInstanceOf(Date);
            expect(updatedStatus2.stoppedAt).toBeUndefined(); // Should still be running
        });

        it('should clear execution status when node caches are dumped', async () => {
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');

            // Start and finish execution
            cache.nodeExecutionStarted('test-node');
            cache.nodeExecutionFinished('test-node');

            const beforeDump = get(executionStore) as ExecutionStatus;
            expect(beforeDump.stoppedAt).toBeInstanceOf(Date);

            // Dump node caches
            await cache.dumpNodeCaches('test-node');

            // Should return to undefined
            expect(get(executionStore)).toBeUndefined();
        });

        it('should preserve execution status when other node data is modified', async () => {
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');

            // Start execution
            cache.nodeExecutionStarted('test-node');
            const startStatus = get(executionStore) as ExecutionStatus;

            // Add some regular socket data
            await cache.cache('test-node', 'output1', 'some data');
            await cache.cache('test-node', 'output2', 'more data');

            // Execution status should be unchanged
            const afterCacheStatus = get(executionStore) as ExecutionStatus;
            expect(afterCacheStatus).toEqual(startStatus);

            // Remove regular socket data
            await cache.remove('test-node', 'output1');

            // Execution status should still be unchanged
            const afterRemoveStatus = get(executionStore) as ExecutionStatus;
            expect(afterRemoveStatus).toEqual(startStatus);
        });
    });

    describe('Integration: Error Logging + Execution Status', () => {
        it('should handle errors during execution lifecycle', async () => {
            const outputKeys = new Set(['output1']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');

            // Start execution
            cache.nodeExecutionStarted('test-node');
            const initialStatus = get(executionStore) as ExecutionStatus;
            expect(initialStatus.startedAt).toBeInstanceOf(Date);
            expect(initialStatus.logs).toEqual([]);

            // Log error during execution
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'Runtime error occurred');
            const statusWithError = get(executionStore) as ExecutionStatus;
            expect(statusWithError.logs).toEqual([[{ type: 'error' }, 'Runtime error occurred']]);

            // Execution status should still show as running
            expect(statusWithError.startedAt).toBeInstanceOf(Date);
            expect(statusWithError.stoppedAt).toBeUndefined();

            // Finish execution (even with error)
            cache.nodeExecutionFinished('test-node');

            const finalStatus = get(executionStore) as ExecutionStatus;
            expect(finalStatus.stoppedAt).toBeInstanceOf(Date);
            expect(finalStatus.logs).toEqual([[{ type: 'error' }, 'Runtime error occurred']]); // Error logs should persist
        });

        it('should clear execution status with error logs when node is dumped', async () => {
            const outputKeys = new Set(['output1']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');

            // Set up execution with error
            cache.nodeExecutionStarted('test-node');
            cache.nodeExecutionLog('test-node', { type: 'error' }, 'Error during execution');
            cache.nodeExecutionFinished('test-node');

            const statusWithError = get(executionStore) as ExecutionStatus;
            expect(statusWithError.logs).toEqual([[{ type: 'error' }, 'Error during execution']]);
            expect(statusWithError.stoppedAt).toBeInstanceOf(Date);

            // Dump node caches
            await cache.dumpNodeCaches('test-node');

            // Execution status should be cleared
            expect(get(executionStore)).toBeUndefined();
        });
    });

    describe('Basic Operations', () => {
        it('should create an empty cache', () => {
            expect(cache.has('node1', 'socket1')).toBe(false);
        });

        it('should cache data for a socket', async () => {
            await cache.cache('node1', 'socket1', 'test data');
            expect(cache.has('node1', 'socket1')).toBe(true);
        });

        it('should retrieve cached data', async () => {
            const testData = { value: 42 };
            await cache.cache('node1', 'socket1', testData);

            const retrieved = await cache.get('node1', 'socket1');
            expect(retrieved).toEqual(testData);
        });

        it('should throw error when getting non-existent socket data', async () => {
            await expect(cache.get('node1', 'socket1')).rejects.toThrow(
                'Socket node1:socket1 not found'
            );
        });

        it('should update existing socket data', async () => {
            await cache.cache('node1', 'socket1', 'initial data');
            await cache.cache('node1', 'socket1', 'updated data');

            const retrieved = await cache.get('node1', 'socket1');
            expect(retrieved).toBe('updated data');
        });

        it('should remove socket data', async () => {
            await cache.cache('node1', 'socket1', 'test data');
            await cache.remove('node1', 'socket1');

            expect(cache.has('node1', 'socket1')).toBe(false);
        });

        it('should clear all data', async () => {
            await cache.cache('node1', 'socket1', 'data1');
            await cache.cache('node2', 'socket2', 'data2');

            await cache.clear();

            expect(cache.has('node1', 'socket1')).toBe(false);
            expect(cache.has('node2', 'socket2')).toBe(false);
        });
    });

    describe('Node Operations', () => {
        it('should dump all caches for a specific node', async () => {
            await cache.cache('node1', 'socket1', 'data1');
            await cache.cache('node1', 'socket2', 'data2');
            await cache.cache('node2', 'socket1', 'data3');

            await cache.dumpNodeCaches('node1');

            expect(cache.has('node1', 'socket1')).toBe(false);
            expect(cache.has('node1', 'socket2')).toBe(false);
            expect(cache.has('node2', 'socket1')).toBe(true);
        });
    });

    describe('Reactive Stores', () => {
        it('should provide reactive socket store', async () => {
            const socketStore = cache.useSocketStore('node1', 'socket1');

            // Initially should be null
            expect(get(socketStore)).toBeNull();

            // After caching data, should return the data
            await cache.cache('node1', 'socket1', 'test data');
            
            // Wait a moment for async conversion
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(get(socketStore)).toBe('test data');
        });

        it('should provide reactive has socket data store', async () => {
            const hasDataStore = cache.hasSocketDataStore('node1', 'socket1');

            // Initially should be false
            expect(get(hasDataStore)).toBe(false);

            // After caching data, should be true
            await cache.cache('node1', 'socket1', 'test data');
            expect(get(hasDataStore)).toBe(true);

            // After removing data, should be false again
            await cache.remove('node1', 'socket1');
            expect(get(hasDataStore)).toBe(false);
        });

        it('should provide reactive node sockets store', async () => {
            const nodeSocketsStore = cache.getNodeStore('node1');

            // Initially should be empty
            expect(get(nodeSocketsStore).size).toBe(0);

            // After adding sockets, should contain them
            await cache.cache('node1', 'socket1', 'data1');
            await cache.cache('node1', 'socket2', 'data2');
            await cache.cache('node2', 'socket1', 'data3'); // Different node

            const nodeData = get(nodeSocketsStore);
            expect(nodeData.size).toBe(2);
            expect(nodeData.get('socket1')).toBe('data1');
            expect(nodeData.get('socket2')).toBe('data2');
            expect(nodeData.has('socket1')).toBe(true); // From node2, should not be included
        });

        it('should provide reactive all data store', async () => {
            const allDataStore = cache.getAllDataStore();

            // Initially should be empty
            expect(get(allDataStore).size).toBe(0);

            // After adding data, should contain it
            await cache.cache('node1', 'socket1', 'data1');
            await cache.cache('node2', 'socket2', 'data2');

            const allData = get(allDataStore);
            expect(allData.size).toBe(2);
            expect(allData.get('node1:socket1')).toBe('data1');
            expect(allData.get('node2:socket2')).toBe('data2');
        });
    });

    describe('Store Reactivity', () => {
        it('should trigger socket store updates when data changes', async () => {
            const socketStore = cache.useSocketStore('node1', 'socket1');
            const mockSubscriber = vi.fn();

            const unsubscribe = socketStore.subscribe(mockSubscriber);

            // Initial call
            expect(mockSubscriber).toHaveBeenCalledWith(null);

            // Should trigger update when data is cached
            await cache.cache('node1', 'socket1', 'new data');
            expect(mockSubscriber).toHaveBeenCalledWith('new data');

            // Should trigger update when data is updated
            await cache.cache('node1', 'socket1', 'updated data');
            expect(mockSubscriber).toHaveBeenCalledWith('updated data');

            // Should trigger update when data is removed
            await cache.remove('node1', 'socket1');
            expect(mockSubscriber).toHaveBeenCalledWith(null);

            unsubscribe();
        });

        it('should trigger has data store updates when data changes', async () => {
            const hasDataStore = cache.hasSocketDataStore('node1', 'socket1');
            const mockSubscriber = vi.fn();

            const unsubscribe = hasDataStore.subscribe(mockSubscriber);

            // Initial call
            expect(mockSubscriber).toHaveBeenCalledWith(false);

            // Should trigger update when data is cached
            await cache.cache('node1', 'socket1', 'data');
            expect(mockSubscriber).toHaveBeenCalledWith(true);

            // Should trigger update when data is removed
            await cache.remove('node1', 'socket1');
            expect(mockSubscriber).toHaveBeenCalledWith(false);

            unsubscribe();
        });
    });

    describe('Edge Cases', () => {
        it('should handle caching null values', async () => {
            await cache.cache('node1', 'socket1', null);

            expect(cache.has('node1', 'socket1')).toBe(true);
            expect(await cache.get('node1', 'socket1')).toBeNull();
        });

        it('should handle caching undefined values', async () => {
            await cache.cache('node1', 'socket1', undefined);

            expect(cache.has('node1', 'socket1')).toBe(true);
            expect(await cache.get('node1', 'socket1')).toBeUndefined();
        });

        it('should handle complex object data', async () => {
            const complexData = {
                nested: {
                    array: [1, 2, 3],
                    object: { key: 'value' },
                },
                function: () => 'test',
            };

            await cache.cache('node1', 'socket1', complexData);
            const retrieved = await cache.get('node1', 'socket1');

            expect(retrieved).toEqual(complexData);
        });

        it('should handle special characters in node and socket IDs', async () => {
            const nodeId = 'node-with-dashes_and_underscores.and.dots';
            const socketId = 'socket:with:colons';

            await cache.cache(nodeId, socketId, 'test data');

            expect(cache.has(nodeId, socketId)).toBe(true);
            expect(await cache.get(nodeId, socketId)).toBe('test data');
        });
    });

    describe('Performance', () => {
        it('should handle large amounts of data efficiently', async () => {
            const startTime = Date.now();

            // Cache 1000 pieces of data
            for (let i = 0; i < 1000; i++) {
                await cache.cache(`node${i}`, `socket${i}`, `data${i}`);
            }

            const cacheTime = Date.now() - startTime;

            // Retrieve all data
            const retrieveStartTime = Date.now();
            for (let i = 0; i < 1000; i++) {
                await cache.get(`node${i}`, `socket${i}`);
            }
            const retrieveTime = Date.now() - retrieveStartTime;

            // These are rough performance checks - adjust thresholds as needed
            expect(cacheTime).toBeLessThan(1000); // Should cache 1000 items in under 1 second
            expect(retrieveTime).toBeLessThan(500); // Should retrieve 1000 items in under 0.5 seconds
        });
    });

    describe('Memory Management', () => {
        it('should properly clean up when clearing cache', async () => {
            // Add some data
            await cache.cache('node1', 'socket1', new Array(1000).fill('data'));
            await cache.cache('node2', 'socket2', new Array(1000).fill('data'));

            // Clear and verify stores are updated
            await cache.clear();

            const allDataStore = cache.getAllDataStore();
            expect(get(allDataStore).size).toBe(0);

            const socketStore = cache.useSocketStore('node1', 'socket1');
            expect(get(socketStore)).toBeNull();
        });
    });
});
