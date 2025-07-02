import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';

export interface NodeSearchResult {
    id: string;
    title: string;
    documentation: string;
    author_uid: string;
    trust_level: string;
    category?: string;
    input_socket_count: number;
    output_socket_count: number;
    similarity?: number;
}

interface SearchResponse {
    results: Array<{
        nid: string;
        title: string;
        description: string;
        similarity?: number;
    }>;
    totalFound: number;
}

export class NodeSearchService {
    private searchNodeBluePrints = httpsCallable<
        {
            query: string;
            limit?: number;
            trustLevelFilter?: string;
            tagFilter?: string[];
        },
        SearchResponse
    >(functions, 'searchNodeBluePrints');

    /**
     * Search nodes by text matching using vector search
     */
    async searchByText(
        searchTerm: string,
        maxResults: number = 20
    ): Promise<NodeSearchResult[]> {
        const searchTermTrimmed = searchTerm.trim();

        if (!searchTermTrimmed) {
            return this.getPopularNodes(maxResults);
        }

        try {
            const result = await this.searchNodeBluePrints({
                query: searchTermTrimmed,
                limit: maxResults,
            });

            return this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error searching nodes:', error);
            return [];
        }
    }

    /**
     * Search nodes by category/trust level
     */
    async searchByCategory(
        trustLevel?: string,
        maxResults: number = 20
    ): Promise<NodeSearchResult[]> {
        try {
            // Use a general search query with trust level filter
            const result = await this.searchNodeBluePrints({
                query: trustLevel ? `trust level ${trustLevel}` : 'nodes',
                limit: maxResults,
                trustLevelFilter: trustLevel,
            });

            return this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error searching nodes by category:', error);
            return [];
        }
    }

    /**
     * Get popular/recommended nodes (Official and Trusted)
     */
    async getPopularNodes(
        maxResults: number = 10
    ): Promise<NodeSearchResult[]> {
        try {
            const result = await this.searchNodeBluePrints({
                query: 'popular recommended nodes',
                limit: maxResults,
                trustLevelFilter: 'Official',
            });

            // If no official nodes, try trusted
            if (result.data.results.length === 0) {
                const trustedResult = await this.searchNodeBluePrints({
                    query: 'popular recommended nodes',
                    limit: maxResults,
                    trustLevelFilter: 'Trusted',
                });
                return this.processSearchResults(trustedResult.data.results);
            }

            return this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error getting popular nodes:', error);
            return [];
        }
    }

    /**
     * Search nodes by socket compatibility
     */
    async searchBySocketType(
        socketType: string,
        isInput: boolean = true,
        maxResults: number = 15
    ): Promise<NodeSearchResult[]> {
        try {
            const socketDirection = isInput ? 'input' : 'output';
            const result = await this.searchNodeBluePrints({
                query: `${socketDirection} socket ${socketType}`,
                limit: maxResults,
            });

            return this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error searching nodes by socket type:', error);
            return [];
        }
    }

    /**
     * Get suggested nodes based on current project context
     */
    async getSuggestedNodes(
        projectDescription?: string,
        maxResults: number = 8
    ): Promise<NodeSearchResult[]> {
        try {
            const query = projectDescription 
                ? `suggested nodes for ${projectDescription}`
                : 'suggested recommended nodes';
            
            const result = await this.searchNodeBluePrints({
                query,
                limit: maxResults,
            });

            return this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error getting suggested nodes:', error);
            // Fallback to popular nodes
            return this.getPopularNodes(maxResults);
        }
    }

    /**
     * Search nodes by tags
     */
    async searchByTags(
        tags: string[],
        maxResults: number = 15
    ): Promise<NodeSearchResult[]> {
        try {
            const result = await this.searchNodeBluePrints({
                query: `nodes with tags ${tags.join(' ')}`,
                limit: maxResults,
                tagFilter: tags,
            });

            return this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error searching nodes by tags:', error);
            return [];
        }
    }

    /**
     * Process function response into NodeSearchResult objects
     */
    private processSearchResults(
        results: Array<{
            nid: string;
            title: string;
            description: string;
            similarity?: number;
        }>
    ): NodeSearchResult[] {
        return results.map((result) => ({
            id: result.nid,
            title: result.title || 'Untitled Node',
            documentation: result.description || '',
            author_uid: '', // Not available in search results
            trust_level: 'Unknown', // Would need separate query to get this
            input_socket_count: 0, // Would need separate query to get this
            output_socket_count: 0, // Would need separate query to get this
            category: this.inferCategoryFromTitle(result.title),
            similarity: result.similarity,
        }));
    }

    /**
     * Infer category from node title (simple heuristic)
     */
    private inferCategoryFromTitle(title: string): string {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('text') || titleLower.includes('string')) {
            return 'text';
        }
        if (titleLower.includes('image') || titleLower.includes('photo')) {
            return 'image';
        }
        if (titleLower.includes('data') || titleLower.includes('json')) {
            return 'data';
        }
        if (titleLower.includes('ai') || titleLower.includes('ml')) {
            return 'ai';
        }
        if (titleLower.includes('web') || titleLower.includes('http')) {
            return 'web';
        }
        
        return 'general';
    }
}
