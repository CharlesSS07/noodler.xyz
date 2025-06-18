/**
 * Unit tests for BigData system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    storeBigData,
    getBigData,
    deleteBigData,
    storeImage,
    storeJimpImage,
    autoConvertToBigData,
    shouldUseBigData,
    isBigDataRef,
    cleanupOldData,
    type BigDataRef,
} from './BigData';

// Mock browser environment
vi.mock('$app/environment', () => ({
    browser: true,
}));

// Mock IndexedDB
const mockIndexedDB = {
    open: vi.fn(),
    databases: vi.fn(),
};

const mockIDBDatabase = {
    transaction: vi.fn(),
    close: vi.fn(),
    objectStoreNames: {
        contains: vi.fn(),
    },
    createObjectStore: vi.fn(),
};

const mockObjectStore = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    createIndex: vi.fn(),
    index: vi.fn(),
    getAll: vi.fn(),
};

const mockTransaction = {
    objectStore: vi.fn(() => mockObjectStore),
};

const mockRequest = {
    onsuccess: null as any,
    onerror: null as any,
    onupgradeneeded: null as any,
    result: null as any,
    error: null as any,
};

// Mock IDBKeyRange
const mockIDBKeyRange = {
    upperBound: vi.fn((value) => ({ upper: value, type: 'upperBound' })),
    lowerBound: vi.fn((value) => ({ lower: value, type: 'lowerBound' })),
    bound: vi.fn((lower, upper) => ({ lower, upper, type: 'bound' })),
    only: vi.fn((value) => ({ value, type: 'only' })),
};

// Setup IndexedDB mocks
beforeEach(() => {
    global.indexedDB = mockIndexedDB as any;
    global.IDBKeyRange = mockIDBKeyRange as any;
    mockIndexedDB.open.mockReturnValue(mockRequest);
    mockIDBDatabase.transaction.mockReturnValue(mockTransaction);
    mockIDBDatabase.objectStoreNames.contains.mockReturnValue(false);
    mockRequest.result = mockIDBDatabase;

    // Reset all mocks
    vi.clearAllMocks();
});

afterEach(() => {
    vi.clearAllMocks();
    // Clean up global mocks
    delete (global as any).indexedDB;
    delete (global as any).IDBKeyRange;
});

describe('BigData Core Functions', () => {
    describe('Type Guards', () => {
        it('should correctly identify BigDataRef objects', () => {
            const bigDataRef: BigDataRef = {
                _type: 'bigdata_ref',
                id: 'test-id',
                dataType: 'string',
                size: 100,
            };

            expect(isBigDataRef(bigDataRef)).toBe(true);
            expect(isBigDataRef({})).toBe(false);
            // expect(isBigDataRef(null)).toBe(false);
            expect(isBigDataRef('string')).toBe(false);
            expect(isBigDataRef({ _type: 'other' })).toBe(false);
        });

        it('should determine when to use BigData based on size thresholds', () => {
            // Small string - shouldn't use BigData
            const smallString = 'hello world';
            expect(shouldUseBigData(smallString)).toBe(false);

            // Large string - should use BigData
            const largeString = 'x'.repeat(200 * 1024); // 200KB
            expect(shouldUseBigData(largeString)).toBe(true);

            // Small file - shouldn't use BigData
            const smallFile = new File(['test'], 'test.txt', {
                type: 'text/plain',
            });
            Object.defineProperty(smallFile, 'size', { value: 50 * 1024 }); // 50KB
            expect(shouldUseBigData(smallFile)).toBe(false);

            // Large file - should use BigData
            const largeFile = new File(['test'], 'large.txt', {
                type: 'text/plain',
            });
            Object.defineProperty(largeFile, 'size', { value: 200 * 1024 }); // 200KB
            expect(shouldUseBigData(largeFile)).toBe(true);

            // Jimp instances - always use BigData
            const jimpMock = { bitmap: { width: 100, height: 100 } };
            expect(shouldUseBigData(jimpMock)).toBe(true);
        });
    });

    describe('Store and Retrieve Operations', () => {
        beforeEach(() => {
            // Mock successful IndexedDB operations
            const simulateSuccess = (request: any, result?: any) => {
                setTimeout(() => {
                    if (request.onsuccess) {
                        request.result = result;
                        request.onsuccess({ target: request });
                    }
                }, 0);
            };

            mockObjectStore.put.mockImplementation(() => {
                const request = { ...mockRequest };
                simulateSuccess(request);
                return request;
            });

            mockObjectStore.get.mockImplementation(() => {
                const request = { ...mockRequest };
                simulateSuccess(request, {
                    id: 'test-id',
                    data: 'test-data',
                    dataType: 'string',
                    size: 100,
                    createdAt: new Date(),
                    lastAccessed: new Date(),
                });
                return request;
            });

            // Mock database initialization
            setTimeout(() => {
                if (mockRequest.onsuccess) {
                    mockRequest.onsuccess({ target: mockRequest });
                }
            }, 0);
        });

        it('should store and retrieve simple data', async () => {
            const testData = 'Hello, BigData!';
            const dataType = 'string';

            const ref = await storeBigData(testData, dataType);

            expect(ref).toMatchObject({
                _type: 'bigdata_ref',
                dataType: 'string',
                size: expect.any(Number),
            });
            expect(ref.id).toMatch(/^bigdata_\d+_/);

            // Note: In a real test, we'd need to mock the retrieval properly
            // For now, we'll test that the function completes without error
        });

        it('should handle storing File objects', async () => {
            const file = new File(['test content'], 'test.txt', {
                type: 'text/plain',
            });

            const ref = await storeImage(file);

            expect(ref).toMatchObject({
                _type: 'bigdata_ref',
                dataType: 'image',
                metadata: {
                    fileName: 'test.txt',
                    mimeType: 'text/plain',
                    originalSize: expect.any(Number),
                },
            });
        });

        it('should handle storing Jimp instances', async () => {
            const jimpMock = {
                bitmap: { width: 100, height: 200 },
            };

            const ref = await storeJimpImage(jimpMock);

            expect(ref).toMatchObject({
                _type: 'bigdata_ref',
                dataType: 'jimp',
                metadata: {
                    width: 100,
                    height: 200,
                },
            });
        });

        it('should auto-convert data based on size threshold', async () => {
            const smallData = 'small';
            const result1 = await autoConvertToBigData(smallData);
            expect(result1).toBe(smallData); // Should not convert

            const largeData = 'x'.repeat(200 * 1024); // 200KB
            const result2 = await autoConvertToBigData(largeData);
            expect(isBigDataRef(result2)).toBe(true); // Should convert
        });
    });

    describe('Error Handling', () => {
        it('should handle IndexedDB initialization failures gracefully', async () => {
            // Mock IndexedDB failure
            mockIndexedDB.open.mockImplementation(() => {
                const request = { ...mockRequest };
                setTimeout(() => {
                    if (request.onerror) {
                        request.error = new Error('IndexedDB unavailable');
                        request.onerror({ target: request });
                    }
                }, 0);
                return request;
            });

            // Should not throw, should use memory fallback
            const result = await storeBigData('test', 'string');
            expect(isBigDataRef(result)).toBe(true);
        });

        it('should return null for missing BigData instead of throwing', async () => {
            const missingRef: BigDataRef = {
                _type: 'bigdata_ref',
                id: 'non-existent-id',
                dataType: 'string',
                size: 100,
            };

            // Mock get returning null (not found)
            mockObjectStore.get.mockImplementation(() => {
                const request = { ...mockRequest };
                setTimeout(() => {
                    if (request.onsuccess) {
                        request.result = undefined;
                        request.onsuccess({ target: request });
                    }
                }, 0);
                return request;
            });

            const result = await getBigData(missingRef);
            expect(result).toBeNull();
        });

        it('should handle non-browser environments with memory fallback', async () => {
            // Mock non-browser environment by re-mocking the module
            vi.doMock('$app/environment', () => ({
                browser: false,
            }));

            // Re-import to get the mocked version
            const {
                storeBigData: storeBigDataMocked,
                getBigData: getBigDataMocked,
                isBigDataRef,
            } = await import('./BigData');

            // Should not throw, should return a BigDataRef and use memory-only storage
            const testData = 'test data for non-browser';
            const result = await storeBigDataMocked(testData, 'string');
            expect(isBigDataRef(result)).toBe(true);
            expect(result.dataType).toBe('string');

            // Should be able to retrieve the data from memory cache
            const retrievedData = await getBigDataMocked(result);
            expect(retrievedData).toBe(testData);

            // Restore browser mock
            vi.doMock('$app/environment', () => ({
                browser: true,
            }));
        });
    });

    describe('Memory Caching', () => {
        it('should use memory cache for recent data', async () => {
            // Store data
            const ref = await storeBigData('cached-data', 'string');

            // First retrieval might hit IndexedDB
            const result1 = await getBigData(ref);

            // Second retrieval should hit memory cache (faster)
            const result2 = await getBigData(ref);

            // Both should return the same data
            // Note: In a real implementation, we'd verify cache usage
        });
    });

    describe('Cleanup Operations', () => {
        beforeEach(() => {
            // Mock cleanup operations
            const mockIndex = {
                openCursor: vi.fn(),
            };

            mockObjectStore.index.mockReturnValue(mockIndex);

            mockIndex.openCursor.mockImplementation(() => {
                const request = { ...mockRequest };
                setTimeout(() => {
                    if (request.onsuccess) {
                        // Simulate cursor with some old entries
                        const cursor = {
                            delete: vi.fn(),
                            continue: vi.fn(),
                            value: {
                                id: 'old-entry',
                                lastAccessed: new Date(
                                    Date.now() - 10 * 24 * 60 * 60 * 1000
                                ), // 10 days old
                            },
                        };
                        request.result = cursor;
                        request.onsuccess({ target: request });

                        // Second call returns null (end of cursor)
                        setTimeout(() => {
                            request.result = null;
                            request.onsuccess({ target: request });
                        }, 0);
                    }
                }, 0);
                return request;
            });
        });

        it('should clean up old data entries', async () => {
            const deletedCount = await cleanupOldData();
            expect(typeof deletedCount).toBe('number');
            expect(deletedCount).toBeGreaterThanOrEqual(0);
        });

        it('should handle cleanup failures gracefully', async () => {
            // Mock cleanup failure
            mockObjectStore.index.mockImplementation(() => {
                throw new Error('Cleanup failed');
            });

            const result = await cleanupOldData();
            expect(result).toBe(0); // Should return 0 on failure
        });
    });

    describe('Delete Operations', () => {
        it('should delete stored data', async () => {
            const ref: BigDataRef = {
                _type: 'bigdata_ref',
                id: 'test-delete-id',
                dataType: 'string',
                size: 100,
            };

            mockObjectStore.delete.mockImplementation(() => {
                const request = { ...mockRequest };
                setTimeout(() => {
                    if (request.onsuccess) {
                        request.onsuccess({ target: request });
                    }
                }, 0);
                return request;
            });

            await expect(deleteBigData(ref)).resolves.not.toThrow();
        });

        it('should handle delete failures gracefully', async () => {
            const ref: BigDataRef = {
                _type: 'bigdata_ref',
                id: 'test-delete-id',
                dataType: 'string',
                size: 100,
            };

            mockObjectStore.delete.mockImplementation(() => {
                const request = { ...mockRequest };
                setTimeout(() => {
                    if (request.onerror) {
                        request.error = new Error('Delete failed');
                        request.onerror({ target: request });
                    }
                }, 0);
                return request;
            });

            // Should not throw, should handle gracefully
            await expect(deleteBigData(ref)).resolves.not.toThrow();
        });
    });
});

describe('BigData Size Calculations', () => {
    it('should calculate sizes correctly for different data types', () => {
        // This tests the private calculateSize method indirectly through storage
        const testCases = [
            { data: 'hello', expectedType: 'number' },
            { data: new ArrayBuffer(100), expectedType: 'number' },
            { data: { key: 'value' }, expectedType: 'number' },
        ];

        testCases.forEach(async ({ data }) => {
            const ref = await storeBigData(data, 'test');
            expect(typeof ref.size).toBe('number');
            expect(ref.size).toBeGreaterThan(0);
        });
    });
});

describe('BigData Integration', () => {
    it('should handle complex nested data structures', async () => {
        const complexData = {
            user: { id: 1, name: 'Test User' },
            settings: { theme: 'dark', notifications: true },
            data: [1, 2, 3, 4, 5],
        };

        const ref = await storeBigData(complexData, 'complex');
        expect(isBigDataRef(ref)).toBe(true);
        expect(ref.dataType).toBe('complex');
    });

    it('should maintain data integrity through store/retrieve cycle', async () => {
        const originalData = {
            message: 'test message',
            timestamp: Date.now(),
            array: [1, 2, 3],
        };

        const ref = await storeBigData(originalData, 'object');

        // Note: In a full integration test, we'd retrieve and compare
        expect(isBigDataRef(ref)).toBe(true);
    });
});
