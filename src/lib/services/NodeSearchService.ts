import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import {getNodeBluePrintModel} from "$lib/compositor/NodeBluePrint";
import {projectState} from "$lib/stores/ProjectState";
import {get} from "svelte/store";
import type {SearchOptions} from "$shared/types/Search";

export interface NodeSearchResult {
    id: string;
    title: string;
    documentation: string;
    author_uid: string;
    trust_level: string;
    input_socket_count: number;
    output_socket_count: number;
    similarity?: number;
}

interface SearchResponse {
    results: Array<{
        nid: string;
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
     * Search libs by text matching using vector search
     */
    async searchByText(options: SearchOptions, category?: string): Promise<NodeSearchResult[]> {
        const searchTermTrimmed = options.query.trim();

        if (!searchTermTrimmed) {
            return this.getPopularNodes(options.limit || 10);
        }

        try {
            const result = await this.searchNodeBluePrints({
                query: category!==undefined ? `${searchTermTrimmed}\n\ncategory=${category}` : searchTermTrimmed,
                trustLevelFilter: options.trustLevelFilter,
                limit: options.limit,
            });

            return await this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error searching libs:', error);
            return [];
        }
    }

    /**
     * Search libs by tags
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

            return await this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error searching libs by tags:', error);
            return [];
        }
    }

    /**
     * Process function response into NodeSearchResult objects
     */
    private async processSearchResults(
        results: Array<{
            nid: string;
            similarity?: number;
        }>
    ): Promise<NodeSearchResult[]> {
        return await Promise.all(results.map(async (result) => {
            const nbp = await getNodeBluePrintModel(result.nid)
            return {
                    id: result.nid,
                        title: nbp.title || 'Untitled Node',
                    documentation: nbp.documentation || '',
                    author_uid: nbp.owner,
                    trust_level: nbp.trust_level, // Would need separate query to get this
                    input_socket_count: 0, // Would need separate query to get this
                    output_socket_count: 0, // Would need separate query to get this
                    similarity: result.similarity,
                }
            }
        ));
    }

    async getPopularNodes(maxResults: number, trustLevelFilter?: string): Promise<NodeSearchResult[]> {

        const projectData = get(projectState);

        const projectContext = projectData.title+'\n\n'+projectData.description;

        try {
            const result = await this.searchNodeBluePrints({
                query: projectContext,
                limit: maxResults,
                trustLevelFilter: trustLevelFilter,
            });

            return await this.processSearchResults(result.data.results);
        } catch (error) {
            console.error('Error searching libs:', error);
            return [];
        }
    }
}
