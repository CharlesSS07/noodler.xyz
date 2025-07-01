import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { ComputedDataCache, type ExecutionStatus } from './ComputedDataCache';
import { OutputSocketAsyncReturner } from './Interpreter';

describe('ComputedDataCache', () => {
    let cache: ComputedDataCache;

    beforeEach(() => {
        cache = new ComputedDataCache();
    });

    describe('Error Handling Reactivity (useNodeErrorStore)', () => {
        it('should reactively track error messages via useNodeErrorStore', async () => {
            const errorStore = cache.useNodeErrorStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = errorStore.subscribe(mockSubscriber);

            // Initially should be null (no error)
            expect(mockSubscriber).toHaveBeenCalledWith(null);
            expect(get(errorStore)).toBeNull();

            // Cache an error message directly
            await cache.cache('test-node', '__error__', 'Test error message');

            // Should trigger reactivity and update the error store
            expect(mockSubscriber).toHaveBeenCalledWith('Test error message');
            expect(get(errorStore)).toBe('Test error message');

            // Update the error message
            await cache.cache(
                'test-node',
                '__error__',
                'Updated error message'
            );
            expect(mockSubscriber).toHaveBeenCalledWith(
                'Updated error message'
            );
            expect(get(errorStore)).toBe('Updated error message');

            // Clear the error
            await cache.remove('test-node', '__error__');
            expect(mockSubscriber).toHaveBeenCalledWith(null);
            expect(get(errorStore)).toBeNull();

            unsubscribe();
        });

        it('should handle error messages via OutputSocketAsyncReturner.errorMessage', async () => {
            const outputKeys = new Set(['output1', 'output2']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const errorStore = cache.useNodeErrorStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = errorStore.subscribe(mockSubscriber);

            // Initially should be null
            expect(mockSubscriber).toHaveBeenCalledWith(null);

            // Set error via OutputSocketAsyncReturner
            await returner.errorMessage('Connection timeout error');

            // Should update error store reactively
            expect(mockSubscriber).toHaveBeenCalledWith(
                'Connection timeout error'
            );
            expect(get(errorStore)).toBe('Connection timeout error');

            // Set another error
            await returner.errorMessage('Validation failed');
            expect(mockSubscriber).toHaveBeenCalledWith('Validation failed');
            expect(get(errorStore)).toBe('Validation failed');

            unsubscribe();
        });

        it('should handle multiple nodes with separate error stores', async () => {
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

            const errorStore1 = cache.useNodeErrorStore('node-1');
            const errorStore2 = cache.useNodeErrorStore('node-2');

            // Set errors for different nodes
            await returner1.errorMessage('Error from node 1');
            await returner2.errorMessage('Error from node 2');

            // Each error store should only contain its own node's error
            expect(get(errorStore1)).toBe('Error from node 1');
            expect(get(errorStore2)).toBe('Error from node 2');

            // Clear one error shouldn't affect the other
            await cache.remove('node-1', '__error__');
            expect(get(errorStore1)).toBeNull();
            expect(get(errorStore2)).toBe('Error from node 2');
        });

        it('should handle error store reactivity when node caches are dumped', async () => {
            const outputKeys = new Set(['output1']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const errorStore = cache.useNodeErrorStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = errorStore.subscribe(mockSubscriber);

            // Set error and some regular data
            await returner.errorMessage('Initial error');
            await cache.cache('test-node', 'output1', 'some data');

            expect(get(errorStore)).toBe('Initial error');

            // Dump all node caches
            await cache.dumpNodeCaches('test-node');

            // Error should be cleared
            expect(mockSubscriber).toHaveBeenCalledWith(null);
            expect(get(errorStore)).toBeNull();

            unsubscribe();
        });

        it('should handle different error data types', async () => {
            const errorStore = cache.useNodeErrorStore('test-node');

            // String error
            await cache.cache('test-node', '__error__', 'String error');
            expect(get(errorStore)).toBe('String error');

            // Object error
            const errorObj = {
                code: 404,
                message: 'Not found',
                details: { path: '/api/test' },
            };
            await cache.cache('test-node', '__error__', errorObj);
            expect(get(errorStore)).toEqual(errorObj);

            // Error instance
            const errorInstance = new Error('JavaScript Error');
            await cache.cache('test-node', '__error__', errorInstance);
            expect(get(errorStore)).toBe(errorInstance);

            // Number error code
            await cache.cache('test-node', '__error__', 500);
            expect(get(errorStore)).toBe(500);
        });
    });

    describe('Execution Status Functions', () => {
        it('should track execution status through start and finish lifecycle', async () => {
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');
            const mockSubscriber = vi.fn();

            const unsubscribe = executionStore.subscribe(mockSubscriber);

            // Initially should be 'idle'
            expect(mockSubscriber).toHaveBeenCalledWith('idle');
            expect(get(executionStore)).toBe('idle');

            // Start execution
            const startTime = new Date();
            cache.nodeExecutionStarted('test-node');

            const startStatus = get(executionStore) as ExecutionStatus;
            expect(startStatus).toHaveProperty('startedAt');
            expect(startStatus).toHaveProperty('finishedAt');
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
            expect(finishStatus).toHaveProperty('finishedAt');
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

            // Should start with 'idle'
            expect(mockSubscriber).toHaveBeenCalledWith('idle');

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
            expect(finishCall).toHaveProperty('finishedAt');
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

        it('should handle execution status for multiple nodes independently', async () => {
            const executionStore1 = cache.useNodeExecutionStatusStore('node-1');
            const executionStore2 = cache.useNodeExecutionStatusStore('node-2');

            // Start execution for both nodes
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

            // Should return to 'idle'
            expect(get(executionStore)).toBe('idle');
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

    describe('Integration: Error Handling + Execution Status', () => {
        it('should handle errors during execution lifecycle', async () => {
            const outputKeys = new Set(['output1']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const errorStore = cache.useNodeErrorStore('test-node');
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');

            // Start execution
            cache.nodeExecutionStarted('test-node');
            expect(get(executionStore)).toHaveProperty('startedAt');
            expect(get(errorStore)).toBeNull();

            // Set error during execution
            await returner.errorMessage('Runtime error occurred');
            expect(get(errorStore)).toBe('Runtime error occurred');

            // Execution status should still show as running
            const statusDuringError = get(executionStore) as ExecutionStatus;
            expect(statusDuringError.startedAt).toBeInstanceOf(Date);
            expect(statusDuringError.stoppedAt).toBeUndefined();

            // Finish execution (even with error)
            cache.nodeExecutionFinished('test-node');

            const finalStatus = get(executionStore) as ExecutionStatus;
            expect(finalStatus.stoppedAt).toBeInstanceOf(Date);
            expect(get(errorStore)).toBe('Runtime error occurred'); // Error should persist
        });

        it('should clear both error and execution status when node is dumped', async () => {
            const outputKeys = new Set(['output1']);
            const returner = new OutputSocketAsyncReturner(
                cache,
                'test-node',
                outputKeys
            );

            const errorStore = cache.useNodeErrorStore('test-node');
            const executionStore =
                cache.useNodeExecutionStatusStore('test-node');

            // Set up execution with error
            cache.nodeExecutionStarted('test-node');
            await returner.errorMessage('Error during execution');
            cache.nodeExecutionFinished('test-node');

            expect(get(errorStore)).toBe('Error during execution');
            expect(get(executionStore)).toHaveProperty('finishedAt');

            // Dump node caches
            await cache.dumpNodeCaches('test-node');

            // Both should be cleared
            expect(get(errorStore)).toBeNull();
            expect(get(executionStore)).toBe('idle');
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
