import { firestore } from '../../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    type QuerySnapshot,
    type DocumentData,
} from 'firebase/firestore';
import type { NodeBluePrintModel } from '$lib/compositor/nodes/NodeBluePrint.js';

export interface NodeSearchResult {
    id: string;
    title: string;
    documentation: string;
    author_uid: string;
    trust_level: string;
    category?: string;
    tags?: string[];
    input_socket_count: number;
    output_socket_count: number;
}

export class NodeSearchService {
    private nodesCollection = collection(firestore, 'nodes');

    /**
     * Search nodes by text matching in title and documentation
     */
    async searchByText(
        searchTerm: string,
        maxResults: number = 20
    ): Promise<NodeSearchResult[]> {
        const searchTermLower = searchTerm.toLowerCase().trim();

        if (!searchTermLower) {
            return this.getPopularNodes(maxResults);
        }

        // Firestore doesn't support full-text search, so we'll do a prefix search on title
        // and then filter by documentation on the client side
        const titleQuery = query(
            this.nodesCollection,
            where('title', '>=', searchTerm),
            where('title', '<=', searchTerm + '\uf8ff'),
            orderBy('title'),
            limit(maxResults * 2) // Get more to filter on client side
        );

        try {
            const snapshot = await getDocs(titleQuery);
            let results = this.processSearchResults(snapshot);

            // Client-side filtering for documentation and better matching
            results = results.filter(
                (node) =>
                    node.title.toLowerCase().includes(searchTermLower) ||
                    node.documentation.toLowerCase().includes(searchTermLower)
            );

            return results.slice(0, maxResults);
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
        let nodeQuery = query(this.nodesCollection, limit(maxResults));

        if (trustLevel) {
            nodeQuery = query(
                this.nodesCollection,
                where('trust_level', '==', trustLevel),
                orderBy('title'),
                limit(maxResults)
            );
        }

        try {
            const snapshot = await getDocs(nodeQuery);
            return this.processSearchResults(snapshot);
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
        const officialQuery = query(
            this.nodesCollection,
            where('trust_level', 'in', ['Official', 'Trusted']),
            orderBy('title'),
            limit(maxResults)
        );

        try {
            const snapshot = await getDocs(officialQuery);
            return this.processSearchResults(snapshot);
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
        // This is a complex query that would need denormalized data in Firestore
        // For now, we'll get all nodes and filter client-side
        // In production, you'd want to store socket types in separate fields for efficient querying

        try {
            const snapshot = await getDocs(
                query(this.nodesCollection, limit(50))
            );
            const allResults = this.processSearchResults(snapshot);

            // Client-side filtering by socket type (this could be optimized with better data structure)
            return allResults
                .filter((node) => {
                    // This is a simplified check - in a real implementation, you'd have
                    // denormalized socket type data for efficient Firestore queries
                    return true; // Placeholder for socket type matching
                })
                .slice(0, maxResults);
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
        // This would ideally use AI/ML for better suggestions
        // For now, return a mix of popular and recent nodes
        return this.getPopularNodes(maxResults);
    }

    /**
     * Process Firestore query results into NodeSearchResult objects
     */
    private processSearchResults(
        snapshot: QuerySnapshot<DocumentData>
    ): NodeSearchResult[] {
        return snapshot.docs.map((doc) => {
            const data = doc.data() as NodeBluePrintModel;
            return {
                id: doc.id,
                title: data.title || 'Untitled Node',
                documentation: data.documentation || '',
                author_uid: data.author_uid || '',
                trust_level: data.trust_level || 'New',
                input_socket_count: data.input_socket_order?.length || 0,
                output_socket_count: data.output_socket_order?.length || 0,
                category: this.inferCategory(data),
                tags: this.extractTags(data),
            };
        });
    }

    /**
     * Infer category from node data
     */
    private inferCategory(node: NodeBluePrintModel): string {
        const title = node.title?.toLowerCase() || '';
        const doc = node.documentation?.toLowerCase() || '';

        if (title.includes('image') || doc.includes('image'))
            return 'Image Processing';
        if (title.includes('text') || doc.includes('text'))
            return 'Text Processing';
        if (
            title.includes('llm') ||
            title.includes('ai') ||
            doc.includes('llm')
        )
            return 'AI/ML';
        if (title.includes('data') || doc.includes('data'))
            return 'Data Processing';
        if (title.includes('file') || doc.includes('file'))
            return 'File Operations';
        if (title.includes('html') || doc.includes('html')) return 'Web/HTML';

        return 'General';
    }

    /**
     * Extract tags from node data for better search
     */
    private extractTags(node: NodeBluePrintModel): string[] {
        const tags: string[] = [];
        const title = node.title?.toLowerCase() || '';
        const doc = node.documentation?.toLowerCase() || '';

        // Extract common keywords as tags
        const keywords = [
            'image',
            'text',
            'ai',
            'llm',
            'data',
            'file',
            'html',
            'json',
            'upload',
            'download',
            'process',
            'transform',
            'generate',
        ];

        keywords.forEach((keyword) => {
            if (title.includes(keyword) || doc.includes(keyword)) {
                tags.push(keyword);
            }
        });

        return tags;
    }

    /**
     * Initialize standard nodes if the collection is empty
     * This can be called during app initialization
     */
    async initializeStandardNodes(): Promise<void> {
        try {
            // Check if we have any nodes
            const snapshot = await getDocs(
                query(this.nodesCollection, limit(1))
            );

            if (snapshot.empty) {
                // In a real app, you might want to automatically populate some basic nodes here
            }
        } catch (error) {
            console.error('Error checking for existing nodes:', error);
        }
    }
}
