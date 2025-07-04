import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeSearchService } from './NodeSearchService';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase functions
vi.mock('../../firebase', () => ({
    functions: {}
}));

vi.mock('firebase/functions', () => ({
    httpsCallable: vi.fn()
}));

describe('NodeSearchService', () => {
    let nodeSearchService: NodeSearchService;
    let mockSearchFunction: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockSearchFunction = vi.fn();
        (httpsCallable as any).mockReturnValue(mockSearchFunction);
        nodeSearchService = new NodeSearchService();
    });

    describe('searchByText', () => {
        it('should return results from the functions API', async () => {
            const mockResults = {
                data: {
                    results: [
                        {
                            nid: 'test-node-1',
                            title: 'Test Node',
                            description: 'A test node for testing',
                            similarity: 0.95
                        }
                    ],
                    totalFound: 1
                }
            };

            mockSearchFunction.mockResolvedValue(mockResults);

            const result = await nodeSearchService.searchByText('test query');

            expect(mockSearchFunction).toHaveBeenCalledWith({
                query: 'test query',
                limit: 20
            });

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: 'test-node-1',
                title: 'Test Node',
                documentation: 'A test node for testing',
                author_uid: '',
                trust_level: 'Unknown',
                input_socket_count: 0,
                output_socket_count: 0,
                category: 'general',
                similarity: 0.95
            });
        });

        it('should return popular libs when search term is empty', async () => {
            const mockResults = {
                data: {
                    results: [
                        {
                            nid: 'popular-node-1',
                            title: 'Popular Node',
                            description: 'A popular node'
                        }
                    ],
                    totalFound: 1
                }
            };

            mockSearchFunction.mockResolvedValue(mockResults);

            const result = await nodeSearchService.searchByText('');

            // Should call getPopularNodes instead
            expect(mockSearchFunction).toHaveBeenCalledWith({
                query: 'popular recommended libs',
                limit: 20, // Uses maxResults parameter from searchByText
                trustLevelFilter: 'Official'
            });
        });

        it('should handle errors gracefully', async () => {
            mockSearchFunction.mockRejectedValue(new Error('API Error'));

            const result = await nodeSearchService.searchByText('test query');

            expect(result).toEqual([]);
        });
    });

    describe('searchByCategory', () => {
        it('should search by trust level', async () => {
            const mockResults = {
                data: {
                    results: [
                        {
                            nid: 'trusted-node-1',
                            title: 'Trusted Node',
                            description: 'A trusted node'
                        }
                    ],
                    totalFound: 1
                }
            };

            mockSearchFunction.mockResolvedValue(mockResults);

            const result = await nodeSearchService.searchByCategory('Trusted');

            expect(mockSearchFunction).toHaveBeenCalledWith({
                query: 'trust level Trusted',
                limit: 20,
                trustLevelFilter: 'Trusted'
            });

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('trusted-node-1');
        });
    });

    describe('searchBySocketType', () => {
        it('should search for input socket types', async () => {
            const mockResults = {
                data: {
                    results: [
                        {
                            nid: 'socket-node-1',
                            title: 'String Input Node',
                            description: 'Node with string input'
                        }
                    ],
                    totalFound: 1
                }
            };

            mockSearchFunction.mockResolvedValue(mockResults);

            const result = await nodeSearchService.searchBySocketType('string', true);

            expect(mockSearchFunction).toHaveBeenCalledWith({
                query: 'input socket string',
                limit: 15
            });

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('socket-node-1');
        });

        it('should search for output socket types', async () => {
            const mockResults = {
                data: {
                    results: [
                        {
                            nid: 'socket-node-2',
                            title: 'Number Output Node',
                            description: 'Node with number output'
                        }
                    ],
                    totalFound: 1
                }
            };

            mockSearchFunction.mockResolvedValue(mockResults);

            const result = await nodeSearchService.searchBySocketType('number', false);

            expect(mockSearchFunction).toHaveBeenCalledWith({
                query: 'output socket number',
                limit: 15
            });

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('socket-node-2');
        });
    });

    describe('getSuggestedNodes', () => {
        it('should get suggestions based on project description', async () => {
            const mockResults = {
                data: {
                    results: [
                        {
                            nid: 'suggestion-node-1',
                            title: 'Image Processing Node',
                            description: 'Processes images'
                        }
                    ],
                    totalFound: 1
                }
            };

            mockSearchFunction.mockResolvedValue(mockResults);

            const result = await nodeSearchService.getSuggestedNodes('image processing project');

            expect(mockSearchFunction).toHaveBeenCalledWith({
                query: 'suggested nodes for image processing project',
                limit: 8
            });

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('suggestion-node-1');
        });

        it('should fallback to popular libs on error', async () => {
            // First call fails, second succeeds
            mockSearchFunction
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce({
                    data: {
                        results: [
                            {
                                nid: 'popular-node-1',
                                title: 'Popular Node',
                                description: 'A popular node'
                            }
                        ],
                        totalFound: 1
                    }
                });

            const result = await nodeSearchService.getSuggestedNodes('test project');

            // Should have called twice - once for suggestions, once for popular
            expect(mockSearchFunction).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('popular-node-1');
        });
    });

    describe('searchByTags', () => {
        it('should search by tags', async () => {
            const mockResults = {
                data: {
                    results: [
                        {
                            nid: 'tagged-node-1',
                            title: 'Tagged Node',
                            description: 'Node with tags'
                        }
                    ],
                    totalFound: 1
                }
            };

            mockSearchFunction.mockResolvedValue(mockResults);

            const result = await nodeSearchService.searchByTags(['math', 'arithmetic']);

            expect(mockSearchFunction).toHaveBeenCalledWith({
                query: 'nodes with tags math arithmetic',
                limit: 15,
                tagFilter: ['math', 'arithmetic']
            });

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('tagged-node-1');
        });
    });

    describe('inferCategoryFromTitle', () => {
        it('should infer text category', () => {
            const service = new NodeSearchService();
            const result = (service as any).inferCategoryFromTitle('Text Processing Node');
            expect(result).toBe('text');
        });

        it('should infer image category', () => {
            const service = new NodeSearchService();
            const result = (service as any).inferCategoryFromTitle('Image Editor Node');
            expect(result).toBe('image');
        });

        it('should default to general category', () => {
            const service = new NodeSearchService();
            const result = (service as any).inferCategoryFromTitle('Unknown Node Type');
            expect(result).toBe('general');
        });
    });
});