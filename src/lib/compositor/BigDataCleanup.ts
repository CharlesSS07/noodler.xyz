/**
 * Cleanup utilities for BigData garbage collection
 */

import { browser } from '$app/environment';

const DB_NAME = 'noodler_bigdata';
const STORE_NAME = 'data_chunks';

interface StoredChunk {
    id: string;
    data: any;
    dataType: string;
    size: number;
    createdAt: Date;
    lastAccessed: Date;
    metadata?: Record<string, any>;
}

export class BigDataCleanup {
    /**
     * Clean up old, unused BigData entries
     */
    static async cleanup(
        maxAge: number = 7 * 24 * 60 * 60 * 1000
    ): Promise<number> {
        if (!browser) {
            return 0;
        }

        try {
            const db = await this.openDB();
            const cutoffDate = new Date(Date.now() - maxAge);

            try {
                return await new Promise<number>((resolve, reject) => {
                    const transaction = db.transaction(
                        [STORE_NAME],
                        'readwrite'
                    );
                    const store = transaction.objectStore(STORE_NAME);
                    const index = store.index('lastAccessed');
                    // Check if IDBKeyRange is available (not in Node.js/testing)
                    const keyRange =
                        typeof IDBKeyRange !== 'undefined'
                            ? IDBKeyRange.upperBound(cutoffDate)
                            : undefined;

                    const request = index.openCursor(keyRange);

                    let deletedCount = 0;

                    request.onerror = () => {
                        console.error(
                            'Failed to cleanup BigData:',
                            request.error
                        );
                        reject(request.error);
                    };

                    request.onsuccess = (event) => {
                        const cursor = (event.target as IDBRequest).result;

                        if (cursor) {
                            cursor.delete();
                            deletedCount++;
                            cursor.continue();
                        } else {
                            console.log(
                                `BigData cleanup completed: deleted ${deletedCount} old entries`
                            );
                            resolve(deletedCount);
                        }
                    };
                });
            } catch (promiseError) {
                console.warn('BigData cleanup promise failed:', promiseError);
                return 0;
            }
        } catch (error) {
            console.warn('BigData cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Get storage statistics
     */
    static async getStats(): Promise<{
        count: number;
        totalSize: number;
        dataTypes: Record<string, number>;
    }> {
        if (!browser) {
            return { count: 0, totalSize: 0, dataTypes: {} };
        }

        try {
            const db = await this.openDB();

            try {
                return await new Promise<{
                    count: number;
                    totalSize: number;
                    dataTypes: Record<string, number>;
                }>((resolve, reject) => {
                    const transaction = db.transaction(
                        [STORE_NAME],
                        'readonly'
                    );
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.getAll();

                    request.onerror = () => {
                        console.error(
                            'Failed to get BigData stats:',
                            request.error
                        );
                        reject(request.error);
                    };

                    request.onsuccess = () => {
                        const chunks = request.result as StoredChunk[];
                        const stats = {
                            count: chunks.length,
                            totalSize: chunks.reduce(
                                (sum, chunk) => sum + chunk.size,
                                0
                            ),
                            dataTypes: chunks.reduce(
                                (types, chunk) => {
                                    types[chunk.dataType] =
                                        (types[chunk.dataType] || 0) + 1;
                                    return types;
                                },
                                {} as Record<string, number>
                            ),
                        };
                        resolve(stats);
                    };
                });
            } catch (promiseError) {
                console.warn('BigData getStats promise failed:', promiseError);
                return { count: 0, totalSize: 0, dataTypes: {} };
            }
        } catch (error) {
            console.warn('Failed to get BigData stats:', error);
            return { count: 0, totalSize: 0, dataTypes: {} };
        }
    }

    /**
     * Delete all BigData entries (nuclear option)
     */
    static async clearAll(): Promise<void> {
        if (!browser) {
            return;
        }

        try {
            const db = await this.openDB();

            try {
                return await new Promise<void>((resolve, reject) => {
                    const transaction = db.transaction(
                        [STORE_NAME],
                        'readwrite'
                    );
                    const store = transaction.objectStore(STORE_NAME);
                    const request = store.clear();

                    request.onerror = () => {
                        console.error(
                            'Failed to clear BigData:',
                            request.error
                        );
                        reject(request.error);
                    };

                    request.onsuccess = () => {
                        console.log('All BigData entries cleared');
                        resolve();
                    };
                });
            } catch (promiseError) {
                console.warn('BigData clearAll promise failed:', promiseError);
                return; // Explicitly return void to prevent undefined behavior
            }
        } catch (error) {
            console.warn('Failed to clear BigData:', error);
        }
    }

    private static async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }
}

/**
 * Automatic cleanup that runs periodically
 */
export function startAutomaticCleanup(intervalHours: number = 24): void {
    if (!browser) {
        return;
    }

    const cleanupInterval = intervalHours * 60 * 60 * 1000; // Convert to milliseconds

    const runCleanup = async () => {
        try {
            const deletedCount = await BigDataCleanup.cleanup();
            if (deletedCount > 0) {
                console.log(
                    `Automatic BigData cleanup: removed ${deletedCount} old entries`
                );
            }
        } catch (error) {
            console.warn('Automatic BigData cleanup failed:', error);
        }
    };

    // Run initial cleanup after a short delay
    setTimeout(runCleanup, 5000);

    // Set up periodic cleanup
    setInterval(runCleanup, cleanupInterval);
}

/**
 * Format bytes for human-readable display
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
