<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { NodeSearchService, type NodeSearchResult } from '../services/NodeSearchService.js';
    import { Search, Plus, Tag, User, Zap } from 'lucide-svelte';

    const dispatch = createEventDispatcher<{
        nodeSelected: { nodeId: string; title: string };
        close: void;
    }>();

    export let isOpen: boolean = false;
    export let position: { x: number; y: number } = { x: 0, y: 0 };

    let searchTerm: string = '';
    let searchResults: NodeSearchResult[] = [];
    let selectedCategory: string = 'all';
    let isLoading: boolean = false;
    let searchInput: HTMLInputElement;

    const nodeSearchService = new NodeSearchService();

    const categories = [
        { value: 'all', label: 'All Nodes' },
        { value: 'Official', label: 'Official' },
        { value: 'Trusted', label: 'Trusted' },
        { value: 'New', label: 'Community' }
    ];

    // Auto-focus search input when opened
    $: if (isOpen && searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }

    // Search when term changes
    $: if (searchTerm !== undefined) {
        performSearch();
    }

    // Search when category changes
    $: if (selectedCategory !== undefined) {
        performSearch();
    }

    onMount(() => {
        loadPopularNodes();
    });

    async function loadPopularNodes(): Promise<void> {
        isLoading = true;
        try {
            searchResults = await nodeSearchService.getPopularNodes(15);
        } catch (error) {
            console.error('Error loading popular nodes:', error);
            searchResults = [];
        } finally {
            isLoading = false;
        }
    }

    async function performSearch(): Promise<void> {
        if (!isOpen) return;
        
        isLoading = true;
        try {
            if (!searchTerm.trim()) {
                // No search term - show by category or popular
                if (selectedCategory === 'all') {
                    searchResults = await nodeSearchService.getPopularNodes(15);
                } else {
                    searchResults = await nodeSearchService.searchByCategory(selectedCategory, 15);
                }
            } else {
                // Search by text
                searchResults = await nodeSearchService.searchByText(searchTerm, 20);
                
                // Filter by category if not 'all'
                if (selectedCategory !== 'all') {
                    searchResults = searchResults.filter(node => 
                        node.trust_level === selectedCategory
                    );
                }
            }
        } catch (error) {
            console.error('Error performing search:', error);
            searchResults = [];
        } finally {
            isLoading = false;
        }
    }

    function selectNode(node: NodeSearchResult): void {
        dispatch('nodeSelected', { 
            nodeId: node.id, 
            title: node.title 
        });
    }

    function closeModal(): void {
        dispatch('close');
    }

    function getTrustLevelColor(trustLevel: string): string {
        switch (trustLevel) {
            case 'Official': return 'text-blue-600 bg-blue-100';
            case 'Trusted': return 'text-green-600 bg-green-100';
            case 'New': return 'text-gray-600 bg-gray-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    }

    function getTrustLevelIcon(trustLevel: string) {
        switch (trustLevel) {
            case 'Official': return Zap;
            case 'Trusted': return User;
            default: return Tag;
        }
    }

    // Handle keyboard shortcuts
    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <!-- Debug: Modal should be visible -->
    {console.log('NodeSearch isOpen:', isOpen, 'position:', position)}
    <!-- Overlay -->
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        onclick={closeModal}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && closeModal()}
    ></div>

    <!-- Search Modal -->
    <div 
        class="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-96"
        style="left: {position.x}px; top: {position.y}px; transform: translate(-50%, 0);"
    >
        <!-- Header -->
        <div class="p-4 border-b border-gray-200">
            <div class="flex items-center gap-2 mb-3">
                <Search class="w-5 h-5 text-gray-500" />
                <h3 class="text-lg font-semibold text-gray-900">Add Node</h3>
                <button 
                    onclick={closeModal}
                    class="ml-auto text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                    ×
                </button>
            </div>

            <!-- Search Input -->
            <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    bind:this={searchInput}
                    bind:value={searchTerm}
                    type="text"
                    placeholder="Search nodes..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            <!-- Category Filter -->
            <div class="flex gap-1 mt-3">
                {#each categories as category}
                    <button
                        onclick={() => selectedCategory = category.value}
                        class="px-3 py-1 text-xs rounded-full transition-colors {
                            selectedCategory === category.value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }"
                    >
                        {category.label}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Results -->
        <div class="max-h-64 overflow-y-auto">
            {#if isLoading}
                <div class="p-8 text-center text-gray-500">
                    <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Searching nodes...
                </div>
            {:else if searchResults.length === 0}
                <div class="p-8 text-center text-gray-500">
                    <Search class="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No nodes found</p>
                    <p class="text-xs mt-1">Try different search terms or categories</p>
                </div>
            {:else}
                <div class="p-2">
                    {#each searchResults as node}
                        <button
                            onclick={() => selectNode(node)}
                            class="w-full p-3 text-left hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-colors"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h4 class="font-medium text-gray-900 truncate">{node.title}</h4>
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full {getTrustLevelColor(node.trust_level)}">
                                            <svelte:component this={getTrustLevelIcon(node.trust_level)} class="w-3 h-3" />
                                            {node.trust_level}
                                        </span>
                                    </div>
                                    
                                    {#if node.documentation}
                                        <p class="text-sm text-gray-600 line-clamp-2 mb-2">
                                            {node.documentation.slice(0, 100)}{node.documentation.length > 100 ? '...' : ''}
                                        </p>
                                    {/if}

                                    <div class="flex items-center gap-4 text-xs text-gray-500">
                                        <span>{node.input_socket_count} inputs</span>
                                        <span>{node.output_socket_count} outputs</span>
                                        {#if node.category}
                                            <span class="bg-gray-100 px-1.5 py-0.5 rounded">{node.category}</span>
                                        {/if}
                                    </div>
                                </div>
                                
                                <Plus class="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50 rounded-b-lg">
            {#if searchResults.length > 0}
                Found {searchResults.length} nodes • Click to add to your flow
            {:else}
                Search through available node blueprints
            {/if}
        </div>
    </div>
{/if}

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>