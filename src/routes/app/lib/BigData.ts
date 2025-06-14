/**
 * BigData system for handling large client-side data that shouldn't be stored in Firestore
 * Uses IndexedDB for persistent storage with automatic cleanup
 */

import { v4 as uuidv4 } from 'uuid';
import { browser } from '$app/environment';

// Configuration
const DB_NAME = 'noodler_bigdata';
const DB_VERSION = 1;
const STORE_NAME = 'data_chunks';
const SIZE_THRESHOLD = 100 * 1024; // 100KB threshold for automatic BigData usage

// BigData reference that gets stored in Firestore
export interface BigDataRef {
    _type: 'bigdata_ref';
    id: string;
    dataType: string;
    size: number;
    metadata?: Record<string, any>;
}

// Internal storage structure
interface StoredChunk {
    id: string;
    data: any;
    dataType: string;
    size: number;
    createdAt: Date;
    lastAccessed: Date;
    metadata?: Record<string, any>;
}

class BigDataManager {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;
    private memoryCache = new Map<
        string,
        { data: any; lastAccessed: number }
    >();
    private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

    constructor() {
        if (browser) {
            this.initPromise = this.initDB();
        }
    }

    private async initDB(): Promise<void> {
        // Check if IndexedDB is available (not in SSR)
        if (typeof indexedDB === 'undefined') {
            console.warn(
                'IndexedDB not available (likely SSR), using memory-only storage'
            );
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.warn(
                        'IndexedDB failed to open, using memory-only storage:',
                        request.error
                    );
                    resolve(); // Don't reject, just continue without IndexedDB
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('BigData IndexedDB initialized successfully');
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    try {
                        const db = (event.target as IDBOpenDBRequest).result;

                        if (!db.objectStoreNames.contains(STORE_NAME)) {
                            const store = db.createObjectStore(STORE_NAME, {
                                keyPath: 'id',
                            });
                            store.createIndex('lastAccessed', 'lastAccessed', {
                                unique: false,
                            });
                            store.createIndex('dataType', 'dataType', {
                                unique: false,
                            });
                        }
                    } catch (error) {
                        console.warn(
                            'IndexedDB upgrade failed, using memory-only storage:',
                            error
                        );
                        resolve(); // Continue without IndexedDB
                    }
                };
            } catch (error) {
                console.warn(
                    'IndexedDB initialization failed, using memory-only storage:',
                    error
                );
                resolve(); // Don't reject, just continue without IndexedDB
            }
        });
    }

    private async ensureDB(): Promise<IDBDatabase | null> {
        if (!browser) {
            throw new Error('BigData is only available in browser environment');
        }

        if (!this.initPromise) {
            this.initPromise = this.initDB();
        }

        await this.initPromise;

        // Return null if IndexedDB isn't available (will fall back to memory-only)
        return this.db;
    }

    /**
     * Store data and return a reference
     */
    async store(
        data: any,
        dataType: string,
        metadata?: Record<string, any>
    ): Promise<BigDataRef> {
        const id = `bigdata_${Date.now()}_${uuidv4()}`;
        const size = this.calculateSize(data);
        const now = new Date();

        // Cache in memory
        this.memoryCache.set(id, { data, lastAccessed: Date.now() });

        // Store in IndexedDB if available
        try {
            const db = await this.ensureDB();
            if (db) {
                const chunk: StoredChunk = {
                    id,
                    data,
                    dataType,
                    size,
                    createdAt: now,
                    lastAccessed: now,
                    metadata,
                };

                await new Promise<void>((resolve, reject) => {
                    const transaction = db.transaction(
                        [STORE_NAME],
                        'readwrite'
                    );
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.put(chunk);

                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve();
                });
                console.log(`BigData stored in IndexedDB: ${id}`);
            } else {
                console.log(`BigData stored in memory only: ${id}`);
            }
        } catch (error) {
            console.warn(
                'Failed to persist to IndexedDB, using memory only:',
                error
            );
        }

        return {
            _type: 'bigdata_ref',
            id,
            dataType,
            size,
            metadata,
        };
    }

    /**
     * Retrieve data from a reference
     */
    async get(ref: BigDataRef): Promise<any> {
        const { id } = ref;

        // Check memory cache first
        const cached = this.memoryCache.get(id);
        if (cached && Date.now() - cached.lastAccessed < this.CACHE_EXPIRY) {
            cached.lastAccessed = Date.now();
            return cached.data;
        }

        // Try IndexedDB if available
        try {
            const db = await this.ensureDB();
            if (db) {
                const chunk = await new Promise<StoredChunk | null>(
                    (resolve, reject) => {
                        const transaction = db.transaction(
                            [STORE_NAME],
                            'readwrite'
                        );
                        const store = transaction.objectStore(STORE_NAME);
                        const getRequest = store.get(id);

                        getRequest.onerror = () => reject(getRequest.error);
                        getRequest.onsuccess = () => {
                            const result = getRequest.result as
                                | StoredChunk
                                | undefined;
                            if (result) {
                                // Update last accessed time
                                result.lastAccessed = new Date();
                                store.put(result);
                            }
                            resolve(result || null);
                        };
                    }
                );

                if (chunk) {
                    // Update memory cache
                    this.memoryCache.set(id, {
                        data: chunk.data,
                        lastAccessed: Date.now(),
                    });
                    return chunk.data;
                }
            }
        } catch (error) {
            console.warn('Failed to retrieve from IndexedDB:', error);
        }

        // Check memory cache again as fallback
        const fallback = this.memoryCache.get(id);
        if (fallback) {
            fallback.lastAccessed = Date.now();
            return fallback.data;
        }

        console.warn(
            `BigData not found: ${id}. This could be due to browser storage being cleared or data expiry.`
        );
        return null; // Return null instead of throwing to prevent crashes
    }

    /**
     * Delete stored data
     */
    async delete(ref: BigDataRef): Promise<void> {
        const { id } = ref;
        this.memoryCache.delete(id);

        try {
            const db = await this.ensureDB();
            if (db) {
                await new Promise<void>((resolve, reject) => {
                    const transaction = db.transaction(
                        [STORE_NAME],
                        'readwrite'
                    );
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.delete(id);

                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve();
                });
            }
        } catch (error) {
            console.warn('Failed to delete from IndexedDB:', error);
        }
    }

    /**
     * Cleanup old entries
     */
    async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
        try {
            const db = await this.ensureDB();
            if (!db) {
                // No IndexedDB available, just clean memory cache
                const cutoffTime = Date.now() - maxAge;
                let deletedCount = 0;

                for (const [id, cached] of this.memoryCache.entries()) {
                    if (cached.lastAccessed < cutoffTime) {
                        this.memoryCache.delete(id);
                        deletedCount++;
                    }
                }

                return deletedCount;
            }

            const cutoffDate = new Date(Date.now() - maxAge);

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const index = store.index('lastAccessed');
                const request = index.openCursor(
                    IDBKeyRange.upperBound(cutoffDate)
                );

                let deletedCount = 0;

                request.onerror = () => reject(request.error);
                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest).result;

                    if (cursor) {
                        cursor.delete();
                        deletedCount++;
                        cursor.continue();
                    } else {
                        resolve(deletedCount);
                    }
                };
            });
        } catch (error) {
            console.warn('BigData cleanup failed:', error);
            return 0;
        }
    }

    private calculateSize(data: any): number {
        try {
            if (data instanceof File) return data.size;
            if (data instanceof Blob) return data.size;
            if (data instanceof ArrayBuffer) return data.byteLength;
            if (typeof data === 'string') return new Blob([data]).size;
            return new Blob([JSON.stringify(data)]).size;
        } catch {
            return 0;
        }
    }
}

// Singleton instance
const bigDataManager = new BigDataManager();

// Main API functions
export async function storeBigData(
    data: any,
    dataType: string,
    metadata?: Record<string, any>
): Promise<BigDataRef> {
    return bigDataManager.store(data, dataType, metadata);
}

export async function getBigData(ref: BigDataRef): Promise<any> {
    return bigDataManager.get(ref);
}

export async function deleteBigData(ref: BigDataRef): Promise<void> {
    return bigDataManager.delete(ref);
}

// Convenience functions for common types
export async function storeImage(file: File): Promise<BigDataRef> {
    return storeBigData(file, 'image', {
        fileName: file.name,
        mimeType: file.type,
        originalSize: file.size,
    });
}

export async function storeJimpImage(jimpInstance: any): Promise<BigDataRef> {
    return storeBigData(jimpInstance, 'jimp', {
        width: jimpInstance.bitmap?.width,
        height: jimpInstance.bitmap?.height,
    });
}

// Automatic conversion helpers
export async function autoConvertToBigData(data: any): Promise<any> {
    if (shouldUseBigData(data)) {
        if (data instanceof File) {
            return storeImage(data);
        } else if (data && typeof data === 'object' && data.bitmap) {
            return storeJimpImage(data);
        } else {
            return storeBigData(data, typeof data, {});
        }
    }
    return data;
}

export function shouldUseBigData(data: any): boolean {
    if (data instanceof File || data instanceof Blob) {
        return data.size > SIZE_THRESHOLD;
    }
    if (data && typeof data === 'object' && data.bitmap) {
        return true; // Always use BigData for Jimp instances
    }
    if (typeof data === 'string') {
        return new Blob([data]).size > SIZE_THRESHOLD;
    }
    return false;
}

// Type guards
export function isBigDataRef(value: any): value is BigDataRef {
    return value && typeof value === 'object' && value._type === 'bigdata_ref';
}

// Cleanup utilities
export async function cleanupOldData(maxAge?: number): Promise<number> {
    return bigDataManager.cleanup(maxAge);
}

// Auto-cleanup setup
export function startAutoCleanup(intervalHours: number = 24): void {
    if (!browser) return;

    const interval = intervalHours * 60 * 60 * 1000;

    const runCleanup = async () => {
        try {
            const deleted = await cleanupOldData();
            if (deleted > 0) {
                console.log(`BigData cleanup: removed ${deleted} old entries`);
            }
        } catch (error) {
            console.warn('BigData cleanup failed:', error);
        }
    };

    // Initial cleanup after 5 seconds
    setTimeout(runCleanup, 5000);

    // Periodic cleanup
    setInterval(runCleanup, interval);
}
