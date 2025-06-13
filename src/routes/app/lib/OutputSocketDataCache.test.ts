import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { OutputSocketDataCache } from './OutputSocketDataCache';

describe('OutputSocketDataCache', () => {
    let cache: OutputSocketDataCache;

    beforeEach(() => {
        cache = new OutputSocketDataCache();
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
            await expect(cache.get('node1', 'socket1')).rejects.toThrow('Socket node1:socket1 not found');
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
            const nodeSocketsStore = cache.getNodeSocketsStore('node1');
            
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
                    object: { key: 'value' }
                },
                function: () => 'test'
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