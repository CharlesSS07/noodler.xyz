/**
 * Unit tests for BigDataCleanup utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BigDataCleanup, startAutomaticCleanup, formatBytes } from './BigDataCleanup';

// Mock browser environment
vi.mock('$app/environment', () => ({
    browser: true
}));

// Mock IndexedDB setup
const mockIndexedDB = {
    open: vi.fn()
};

const mockIDBDatabase = {
    transaction: vi.fn(),
    close: vi.fn()
};

const mockObjectStore = {
    index: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn()
};

const mockIndex = {
    openCursor: vi.fn()
};

const mockTransaction = {
    objectStore: vi.fn(() => mockObjectStore)
};

const mockRequest = {
    onsuccess: null as any,
    onerror: null as any,
    result: null as any,
    error: null as any
};

// Mock IDBKeyRange
const mockIDBKeyRange = {
    upperBound: vi.fn((value) => ({ upper: value, type: 'upperBound' })),
    lowerBound: vi.fn((value) => ({ lower: value, type: 'lowerBound' })),
    bound: vi.fn((lower, upper) => ({ lower, upper, type: 'bound' })),
    only: vi.fn((value) => ({ value, type: 'only' }))
};

// Setup mocks
beforeEach(() => {
    global.indexedDB = mockIndexedDB as any;
    global.IDBKeyRange = mockIDBKeyRange as any;
    
    // Reset request mock
    mockRequest.onsuccess = null;
    mockRequest.onerror = null;
    mockRequest.result = mockIDBDatabase;
    mockRequest.error = null;
    
    mockIndexedDB.open.mockReturnValue(mockRequest);
    mockIDBDatabase.transaction.mockReturnValue(mockTransaction);
    mockObjectStore.index.mockReturnValue(mockIndex);
    
    vi.clearAllMocks();
    
    // Mock successful database opening - make it synchronous for testing
    mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockRequest };
        // Simulate immediate success
        queueMicrotask(() => {
            if (request.onsuccess) {
                request.onsuccess({ target: request });
            }
        });
        return request;
    });
});

afterEach(() => {
    vi.clearAllMocks();
    // Clean up global mocks
    delete (global as any).indexedDB;
    delete (global as any).IDBKeyRange;
});

describe('BigDataCleanup', () => {
    describe('cleanup()', () => {
        it('should clean up old entries and return count', async () => {
            let deletedCount = 0;
            
            // Simple mock that simulates finding and deleting 2 old entries
            mockIndex.openCursor.mockImplementation(() => {
                const request = { ...mockRequest };
                
                queueMicrotask(() => {
                    if (request.onsuccess) {
                        // Simulate cursor finding first entry
                        const cursor = {
                            delete: vi.fn(() => { deletedCount++; }),
                            continue: vi.fn(() => {
                                queueMicrotask(() => {
                                    if (deletedCount < 2) {
                                        // Second entry
                                        request.result = {
                                            delete: vi.fn(() => { deletedCount++; }),
                                            continue: vi.fn(() => {
                                                queueMicrotask(() => {
                                                    // End of cursor
                                                    request.result = null;
                                                    request.onsuccess({ target: request });
                                                });
                                            }),
                                            value: { id: 'old2' }
                                        };
                                    } else {
                                        // End of cursor
                                        request.result = null;
                                    }
                                    request.onsuccess({ target: request });
                                });
                            }),
                            value: { id: 'old1' }
                        };
                        request.result = cursor;
                        request.onsuccess({ target: request });
                    }
                });
                
                return request;
            });

            const result = await BigDataCleanup.cleanup();
            expect(result).toBe(2);
        });

        it('should use default max age of 7 days', async () => {
            let capturedRange: any;
            
            mockIndex.openCursor.mockImplementation((range) => {
                // Capture the range to verify max age
                capturedRange = range;
                
                const request = { ...mockRequest };
                queueMicrotask(() => {
                    if (request.onsuccess) {
                        request.result = null; // No entries
                        request.onsuccess({ target: request });
                    }
                });
                return request;
            });

            await BigDataCleanup.cleanup();
            
            // Verify that IDBKeyRange.upperBound was called
            expect(mockIDBKeyRange.upperBound).toHaveBeenCalled();
            
            // Verify the range was used
            expect(capturedRange).toBeDefined();
            expect(capturedRange.type).toBe('upperBound');
            
            // Verify the cutoff date is approximately 7 days ago
            if (capturedRange.upper) {
                const ageInMs = Date.now() - capturedRange.upper.getTime();
                const ageInDays = ageInMs / (24 * 60 * 60 * 1000);
                expect(ageInDays).toBeCloseTo(7, 0); // Within 1 day of 7 days
            }
        });

        it('should accept custom max age', async () => {
            const customMaxAge = 3 * 24 * 60 * 60 * 1000; // 3 days
            let capturedRange: any;
            
            mockIndex.openCursor.mockImplementation((range) => {
                capturedRange = range;
                
                const request = { ...mockRequest };
                queueMicrotask(() => {
                    if (request.onsuccess) {
                        request.result = null;
                        request.onsuccess({ target: request });
                    }
                });
                return request;
            });

            await BigDataCleanup.cleanup(customMaxAge);
            
            // Verify that IDBKeyRange.upperBound was called
            expect(mockIDBKeyRange.upperBound).toHaveBeenCalled();
            
            // Verify the cutoff date is approximately 3 days ago
            if (capturedRange && capturedRange.upper) {
                const ageInMs = Date.now() - capturedRange.upper.getTime();
                const ageInDays = ageInMs / (24 * 60 * 60 * 1000);
                expect(ageInDays).toBeCloseTo(3, 0); // Within 1 day of 3 days
            }
        });

        it('should handle cleanup errors gracefully', async () => {
            mockIndex.openCursor.mockImplementation(() => {
                const request = { ...mockRequest };
                queueMicrotask(() => {
                    if (request.onerror) {
                        request.error = new Error('Cursor failed');
                        request.onerror({ target: request });
                    }
                });
                return request;
            });

            // With the fixed implementation, errors should be caught and return 0
            const result = await BigDataCleanup.cleanup();
            expect(result).toBe(0);
        });

        it('should return 0 when not in browser environment', async () => {
            // Mock non-browser environment
            vi.doMock('$app/environment', () => ({
                browser: false
            }));

            // Re-import to get the mocked version
            const { BigDataCleanup: BigDataCleanupMocked } = await import('./BigDataCleanup');

            const result = await BigDataCleanupMocked.cleanup();
            expect(result).toBe(0);

            // Restore browser mock
            vi.doMock('$app/environment', () => ({
                browser: true
            }));
        });
    });

    describe('getStats()', () => {
        it('should return storage statistics', async () => {
            const mockData = [
                { id: '1', dataType: 'image', size: 1000, lastAccessed: new Date() },
                { id: '2', dataType: 'jimp', size: 2000, lastAccessed: new Date() },
                { id: '3', dataType: 'image', size: 1500, lastAccessed: new Date() }
            ];

            mockObjectStore.getAll.mockImplementation(() => {
                const request = { ...mockRequest };
                queueMicrotask(() => {
                    if (request.onsuccess) {
                        request.result = mockData;
                        request.onsuccess({ target: request });
                    }
                });
                return request;
            });

            const stats = await BigDataCleanup.getStats();
            
            expect(stats).toEqual({
                count: 3,
                totalSize: 4500,
                dataTypes: {
                    image: 2,
                    jimp: 1
                }
            });
        });

        it('should return empty stats on error', async () => {
            mockObjectStore.getAll.mockImplementation(() => {
                const request = { ...mockRequest };
                queueMicrotask(() => {
                    if (request.onerror) {
                        request.error = new Error('getAll failed');
                        request.onerror({ target: request });
                    }
                });
                return request;
            });

            const stats = await BigDataCleanup.getStats();
            expect(stats).toEqual({
                count: 0,
                totalSize: 0,
                dataTypes: {}
            });
        });

        it('should return empty stats when not in browser', async () => {
            // Mock non-browser environment
            vi.doMock('$app/environment', () => ({
                browser: false
            }));

            // Re-import to get the mocked version
            const { BigDataCleanup: BigDataCleanupMocked } = await import('./BigDataCleanup');

            const stats = await BigDataCleanupMocked.getStats();
            expect(stats).toEqual({
                count: 0,
                totalSize: 0,
                dataTypes: {}
            });

            // Restore browser mock
            vi.doMock('$app/environment', () => ({
                browser: true
            }));
        });
    });

    describe('clearAll()', () => {
        it('should clear all BigData entries', async () => {
            mockObjectStore.clear.mockImplementation(() => {
                const request = { 
                    ...mockRequest,
                    onsuccess: null,
                    onerror: null,
                    result: null,
                    error: null
                };
                queueMicrotask(() => {
                    if (request.onsuccess) {
                        request.onsuccess({ target: request });
                    }
                });
                return request;
            });

            await expect(BigDataCleanup.clearAll()).resolves.not.toThrow();
            expect(mockObjectStore.clear).toHaveBeenCalled();
        });

        it('should handle clear errors gracefully', async () => {
            // Mock console.warn to verify error handling
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            mockObjectStore.clear.mockImplementation(() => {
                const request = { 
                    onsuccess: null as any,
                    onerror: null as any,
                    result: null,
                    error: null
                };
                
                queueMicrotask(() => {
                    if (request.onerror) {
                        request.error = new Error('Clear failed');
                        request.onerror({ target: request });
                    }
                });
                
                return request;
            });

            // clearAll should not throw even when there are internal errors
            const result = await BigDataCleanup.clearAll();
            expect(result).toBeUndefined(); // void function returns undefined
            
            // Verify that the error was logged
            expect(consoleWarnSpy).toHaveBeenCalledWith('BigData clearAll promise failed:', expect.any(Error));
            
            consoleWarnSpy.mockRestore();
        });

        it('should do nothing when not in browser', async () => {
            // Clear previous mock calls
            vi.clearAllMocks();
            
            // Mock non-browser environment
            vi.doMock('$app/environment', () => ({
                browser: false
            }));

            // Re-import to get the mocked version
            const { BigDataCleanup: BigDataCleanupMocked } = await import('./BigDataCleanup');

            await expect(BigDataCleanupMocked.clearAll()).resolves.not.toThrow();
            expect(mockObjectStore.clear).not.toHaveBeenCalled();

            // Restore browser mock
            vi.doMock('$app/environment', () => ({
                browser: true
            }));
        });
    });
});

describe('startAutomaticCleanup()', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start automatic cleanup with default interval', () => {
        const cleanupSpy = vi.spyOn(BigDataCleanup, 'cleanup').mockResolvedValue(0);

        startAutomaticCleanup();

        // Should run initial cleanup after 5 seconds
        expect(cleanupSpy).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5000);
        expect(cleanupSpy).toHaveBeenCalledTimes(1);

        // Should run periodic cleanup every 24 hours
        vi.advanceTimersByTime(24 * 60 * 60 * 1000);
        expect(cleanupSpy).toHaveBeenCalledTimes(2);

        cleanupSpy.mockRestore();
    });

    it('should accept custom cleanup interval', () => {
        const cleanupSpy = vi.spyOn(BigDataCleanup, 'cleanup').mockResolvedValue(0);
        const customInterval = 12; // 12 hours

        startAutomaticCleanup(customInterval);

        // Initial cleanup
        vi.advanceTimersByTime(5000);
        expect(cleanupSpy).toHaveBeenCalledTimes(1);

        // Custom interval cleanup
        vi.advanceTimersByTime(12 * 60 * 60 * 1000); // 12 hours
        expect(cleanupSpy).toHaveBeenCalledTimes(2);

        cleanupSpy.mockRestore();
    });

    it('should handle cleanup failures gracefully', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        // Mock cleanup to succeed first, then fail
        let callCount = 0;
        const cleanupSpy = vi.spyOn(BigDataCleanup, 'cleanup').mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
                return Promise.resolve(5); // Success with 5 deleted
            } else {
                return Promise.reject(new Error('Cleanup failed'));
            }
        });

        startAutomaticCleanup(1); // 1 hour interval for faster testing

        // First cleanup - success (wait for async operations)
        await vi.advanceTimersByTimeAsync(5000);
        expect(cleanupSpy).toHaveBeenCalledTimes(1);

        // Second cleanup - failure (wait for async operations)
        await vi.advanceTimersByTimeAsync(60 * 60 * 1000); // 1 hour
        expect(cleanupSpy).toHaveBeenCalledTimes(2);

        // Should log success and warning
        expect(consoleLogSpy).toHaveBeenCalledWith('Automatic BigData cleanup: removed 5 old entries');
        expect(consoleWarnSpy).toHaveBeenCalledWith('Automatic BigData cleanup failed:', expect.any(Error));

        cleanupSpy.mockRestore();
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    it('should do nothing when not in browser', async () => {
        // Set up spies before any imports
        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
        const setIntervalSpy = vi.spyOn(global, 'setInterval');
        
        // Clear any previous calls
        setTimeoutSpy.mockClear();
        setIntervalSpy.mockClear();
        
        // Mock non-browser environment
        vi.doMock('$app/environment', () => ({
            browser: false
        }));

        // Re-import to get the mocked version
        const { startAutomaticCleanup: startAutomaticCleanupMocked } = await import('./BigDataCleanup');

        startAutomaticCleanupMocked();

        expect(setTimeoutSpy).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();

        // Clean up spies
        setTimeoutSpy.mockRestore();
        setIntervalSpy.mockRestore();

        // Restore browser mock
        vi.doMock('$app/environment', () => ({
            browser: true
        }));
    });
});

describe('formatBytes()', () => {
    it('should format bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(formatBytes(1024 * 1024)).toBe('1 MB');
        expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
        expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
        expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });

    it('should handle edge cases', () => {
        expect(formatBytes(1)).toBe('1 Bytes');
        expect(formatBytes(1023)).toBe('1023 Bytes');
        expect(formatBytes(1025)).toBe('1 KB');
    });

    it('should round to 2 decimal places', () => {
        expect(formatBytes(1536.789)).toBe('1.5 KB');
        expect(formatBytes(1024 * 1.999)).toBe('2 KB');
    });
});