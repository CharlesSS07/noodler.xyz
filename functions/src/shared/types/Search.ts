export interface SearchOptions {
    query: string;
    limit?: number;
    trustLevelFilter?: string;
    tagFilter?: string[];
}

export interface SearchResult {
    nid: string;
    similarity?: number;
}
