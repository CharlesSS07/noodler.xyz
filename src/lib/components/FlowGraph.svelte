<script lang="ts">

    let {project_key = 'project_key_not_assigned'} = $props<{ project_key?: string }>();

    import {
        SvelteFlow,
        Controls,
        Background,
        BackgroundVariant,
        MiniMap, Panel,
        type Node,
        type Edge,
        type ColorMode,
        type Viewport, getViewportForBounds
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';


    import NoteNode from '../../routes/app/nodes/NoteNode.svelte';
    import StemNode from '$lib/components/StemNode.svelte';
    import TextTemplateFillinNode from "../../routes/app/nodes/text/TextTemplateFillinNode.svelte";
    import ImageNode from "../../routes/app/nodes/images/ImageNode.svelte";
    import TextEditorNode from "../../routes/app/nodes/text/TextEditorMarkdownNode.svelte";
    import HTMLRendererNode from "../../routes/app/nodes/html/HTMLRendererNode.svelte";

    import Logo from "../../components/Logo.svelte";
    import NodeSearch from "./NodeSearch.svelte";
    import BugReportButton from "../../components/BugReportButton.svelte";
    import { Plus, Play, X, ChevronDown } from "lucide-svelte";
    import { projectState, projectActions, projectSync } from "$lib/stores/ProjectState";
    import { executeFlowGraph } from "../../routes/app/lib/Interpreter";
    
    // Import the existing nodes
    import CompleteTextLLM from "../../routes/app/nodes/huggingface/CompleteTextLLM.svelte";
    import TextEditorRaw from "../../routes/app/nodes/text/TextEditorRawNode.svelte";

    let nodes = $state.raw<Node[]>([]);

    let edges = $state.raw<Edge[]>([]);

    // Track project sync state
    let isInitialized = false;
    let hasLoadedFromFirebase = false;

    // Initialize project sync when project_key changes
    $effect(() => {
        if (project_key && project_key !== 'project_key_not_assigned') {
            projectSync.syncProject(project_key);
            isInitialized = true;
        }

        // Cleanup function
        return () => {
            if (isInitialized) {
                projectSync.cleanup();
                isInitialized = false;
            }
        };
    });

    // Sync local nodes/edges with ProjectState
    $effect(() => {
        if (isInitialized) {
            projectActions.setNodes(nodes);
        }
    });

    $effect(() => {
        if (isInitialized) {
            projectActions.setEdges(edges);
        }
    });

    // Subscribe to ProjectState changes and update local state
    $effect(() => {
        const unsubscribe = projectState.subscribe(state => {
            if (isInitialized && state.projectId === project_key) {
                // Only update from ProjectState if there are no pending local changes
                // This prevents overwriting local changes that are queued for auto-save
                if (!state.isDirty) {
                    // Update local nodes if they differ (ensure arrays)
                    const stateNodes = Array.isArray(state.nodes) ? state.nodes : [];
                    if (JSON.stringify(nodes) !== JSON.stringify(stateNodes)) {
                        nodes = [...stateNodes];
                    }
                    // Update local edges if they differ (ensure arrays)
                    const stateEdges = Array.isArray(state.edges) ? state.edges : [];
                    if (JSON.stringify(edges) !== JSON.stringify(stateEdges)) {
                        edges = [...stateEdges];
                    }
                    
                    // Mark that we've loaded data from Firebase
                    if (!hasLoadedFromFirebase) {
                        hasLoadedFromFirebase = true;
                    }
                }
            }
        });

        return unsubscribe;
    });

    // Add default intro node when appropriate
    $effect(() => {
        if (isInitialized && hasLoadedFromFirebase && nodes.length === 0) {
            const introNodeId = 'defaultIntroNodeId';
            addNode({
                type: 'note',
                data: {
                    markdown: `# Welcome to noodler.xyz!
A project by Charles Strauss (c-shelby-07@proton.me <-- reach out for support)

* Pan around by clicking and dragging on the canvas.
* Scroll to zoom.
* Add a node by clicking on one of the buttons above. Wire nodes together to create flow functionality.

## TODO:
1. Node search tool --> KNN over embeddings of node code, name, and descriptions. Also just plain old text comparison.
2. More standard nodes
3. Oauth integrations to cut costs
4. NodeAI for developing new nodes
5. FlowAI for developing flows`
                },
                position: {x: 0, y: 100}
            }, introNodeId);
        }
    });

    // Helper functions for manual node operations
    export function addNode(node: Omit<Node, 'id'>, id?: string): void {
        try {
            const newNode: Node = {
                id: id || crypto.randomUUID(),
                ...node
            };

            nodes = [...nodes, newNode];
        } catch (error) {
            console.error('Error adding node:', error);
        }
    }

    // Helper functions for manual edge operations
    export function addEdge(edge: Omit<Edge, 'id'> | Edge): void {
        try {
            const newEdge: Edge = {
                id: 'id' in edge ? edge.id : crypto.randomUUID(),
                ...edge
            };

            edges = [...edges, newEdge];
        } catch (error) {
            console.error('Error adding edge:', error);
        }
    }

    const nodeTypes = {
        note: NoteNode,
        node: StemNode, // a node which takes on the properties stored by the server
        image: ImageNode,
        html: HTMLRendererNode,
        textTemplate: TextTemplateFillinNode,
        textEditorMd: TextEditorNode,
        huggingfaceLLM: CompleteTextLLM,
        textEditorRaw: TextEditorRaw
    };

    let colorMode: ColorMode = $state('light');

    // Node search state
    let showNodeSearch = $state(false);

    // Add a variable to store the viewport
    let viewport: Viewport = $state({ x: 0, y: 0, zoom: 1 });

    let flowContainer: HTMLDivElement;

    // Execution state
    let isExecuting = $state(false);
    let showExecutionPanel = $state(false);
    let executionLogs = $state<string[]>([]);
    let selectedExecutionNode = $state<string | null>(null);

    // Dropdown state
    let showNodeDropdown = $state(false);

    // Available node types for dropdown
    const availableNodes = [
        {
            id: 'note',
            type: 'note',
            title: 'Note',
            description: 'Markdown note with editing capabilities',
            category: 'Basic',
            defaultData: {
                markdown: '# New Note\n\nWrite your markdown here...'
            }
        },
        {
            id: 'textEditorRaw',
            type: 'textEditorRaw',
            title: 'Raw Text Editor',
            description: 'Simple text input/output editor',
            category: 'Text',
            defaultData: {
                input: { text: '' },
                nid: 'node_official_raw_text_editor'
            }
        },
        // {
        //     id: 'textEditor',
        //     type: 'textEditor',
        //     title: 'Text Editor',
        //     description: 'Advanced text editor with formatting',
        //     category: 'Text',
        //     defaultData: {
        //         input: { text: '' },
        //         nid: 'node_official_md_text_editor'
        //     }
        // },
        {
            id: 'textTemplate',
            type: 'textTemplate',
            title: 'Text Template',
            description: 'Template with variable substitution',
            category: 'Text',
            defaultData: {
                template: 'Hello @name!',
                inputs: { name: 'noodler' },
                nid: 'node_official_template'
            }
        },
        {
            id: 'html',
            type: 'html',
            title: 'HTML Renderer',
            description: 'Renders HTML content in iframe',
            category: 'Display',
            defaultData: {
                html: ''
            }
        },
        {
            id: 'image',
            type: 'image',
            title: 'Image',
            description: 'Image display and processing',
            category: 'Media',
            defaultData: {
                input: { },
                nid: 'node_official_image_loader'
            }
        },
        // {
        //     id: 'huggingfaceLLM',
        //     type: 'huggingfaceLLM',
        //     title: 'HuggingFace LLM',
        //     description: 'Text completion using HuggingFace models',
        //     category: 'AI',
        //     defaultData: { input: '', model: 'gpt2' }
        // }
    ];

    // Node search functions
    function openNodeSearch(event?: KeyboardEvent | MouseEvent): void {
        if (flowContainer) {
            const rect = flowContainer.getBoundingClientRect();
        }
        showNodeSearch = true;
    }

    // Handle node selection from search
    async function handleNodeSelected(event: CustomEvent<{ nodeId: string; title: string }>): Promise<void> {
        const { nodeId, title } = event.detail;
        showNodeSearch = false;

        // Create a new node instance from the blueprint
        await addNodeFromBlueprint(nodeId, title);
    }

    // Add a node to the flow from blueprint
    async function addNodeFromBlueprint(blueprintId: string, title: string): Promise<void> {
        console.log(viewport)
        const centerX = (-viewport.x + (typeof window !== 'undefined' ? window.innerWidth : 800) / 2) / viewport.zoom;
        const centerY = (-viewport.y + (typeof window !== 'undefined' ? window.innerHeight : 600) / 2) / viewport.zoom;

        const newNode: Node = {
            id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 2+9)}`,
            type: 'node', // Use StemNode for blueprint-based nodes
            position: {
                x: centerX - 100, // Offset slightly from center
                y: centerY - 25
            },
            data: {
                nid: blueprintId,
                input: {},
                title: title
            }
        };

        addNode(newNode, newNode.id);
    }

    // Handle keyboard events
    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            openNodeSearch(event);
        } else if (event.key === 'Escape') {
            showNodeDropdown = false;
            showNodeSearch = false;
        }
    }

    // Handle click outside to close dropdown
    function handleClickOutside(event: MouseEvent): void {
        if (showNodeDropdown) {
            const target = event.target as HTMLElement;
            const dropdownButton = target.closest('.dropdown-btn');
            const dropdownMenu = target.closest('.dropdown-menu');
            
            if (!dropdownButton && !dropdownMenu) {
                showNodeDropdown = false;
            }
        }
    }

    // Execution functions
    async function executeFromNode(nodeId: string): Promise<void> {
        if (isExecuting) return;
        
        isExecuting = true;
        // showExecutionPanel = true; // DISABLED: Don't show execution panel anymore
        selectedExecutionNode = nodeId;
        // executionLogs = [`Starting execution from node: ${nodeId}`]; // DISABLED: No longer logging
        
        try {
            // NOTE: Console.log capture has been removed since we're not showing the execution panel
            // The execution logger was not particularly helpful and just clogged up the screen.
            // Execution still works fine - we just don't capture/display the logs anymore.
            
            await executeFlowGraph(nodeId, nodes, edges);
            
            // executionLogs = [...executionLogs, `✅ Execution completed successfully`]; // DISABLED
            console.log('✅ Execution completed successfully');
        } catch (error) {
            console.error('Execution failed:', error);
            // executionLogs = [...executionLogs, `❌ Execution failed: ${error}`]; // DISABLED
        } finally {
            isExecuting = false;
        }
    }

    function executeFromSelectedNode(): void {
        const selectedNodes = nodes.filter(node => node.selected);
        if (selectedNodes.length === 1) {
            executeFromNode(selectedNodes[0].id);
        } else if (selectedNodes.length === 0) {
            alert('Please select a node to execute from');
        } else {
            alert('Please select only one node to execute from');
        }
    }

    function clearExecutionLogs(): void {
        executionLogs = [];
        showExecutionPanel = false;
        selectedExecutionNode = null;
    }

    // Dropdown functions
    function addNodeFromDropdown(nodeConfig: typeof availableNodes[0]): void {
        console.log(viewport)
        const centerX = (-viewport.x + (typeof window !== 'undefined' ? window.innerWidth : 800) / 2) / viewport.zoom;
        const centerY = (-viewport.y + (typeof window !== 'undefined' ? window.innerHeight : 600) / 2) / viewport.zoom;

        console.log(flowContainer);
        const newNode: Node = {
            id: `${nodeConfig.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: nodeConfig.type,
            position: {
                x: centerX + 100, // Random position
                y: centerY + 100
            },
            data: nodeConfig.defaultData
        };

        addNode(newNode, newNode.id);
        showNodeDropdown = false;
    }

    // Group nodes by category for dropdown
    const nodesByCategory = $derived(() => {
        const grouped: Record<string, typeof availableNodes> = {};
        availableNodes.forEach(node => {
            if (!grouped[node.category]) {
                grouped[node.category] = [];
            }
            grouped[node.category].push(node);
        });
        return grouped;
    });

    // onMount(() => {
    //     auth.authStateReady().then(() => {
    //
    //     });
    // });

</script>


<svelte:window onkeydown={handleKeydown} onclick={handleClickOutside} />

<div class="flowgraph-container" bind:this={flowContainer}>
    <SvelteFlow
        bind:nodes
        bind:edges
        bind:viewport
        {nodeTypes}
        {colorMode}
        oninit={() => {}}
        fitView
    >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />

        <Panel position="top-left">
            <div class="project-info">
                <Logo size={3} />
                {#if $projectState.title}
                    <h3 class="text-lg font-semibold">{$projectState.title}</h3>
                {/if}
                {#if $projectState.isDirty}
                    <span class="text-xs text-orange-500">• Unsaved changes</span>
                {:else if $projectState.isSyncing}
                    <span class="text-xs text-blue-500">• Syncing...</span>
                {:else}
                    <span class="text-xs text-green-500">• Saved</span>
                {/if}
            </div>
        </Panel>

        <Panel position="top-right">
            <div class="controls-panel">
                <BugReportButton size="md" />
                
                <button
                    onclick={executeFromSelectedNode}
                    class="control-btn execution-btn"
                    class:executing={isExecuting}
                    disabled={isExecuting}
                    title="Execute from selected node"
                >
                    <Play class="w-4 h-4" />
                    {isExecuting ? 'Executing...' : 'Execute'}
                </button>
                
                <!-- Node Dropdown -->
                <div class="relative">
                    <button
                        onclick={() => showNodeDropdown = !showNodeDropdown}
                        class="control-btn dropdown-btn"
                        title="Add existing node types"
                    >
                        <Plus class="w-4 h-4" />
                        Node Types
                        <ChevronDown class="w-3 h-3 ml-1" />
                    </button>
                    
                    {#if showNodeDropdown}
                        <div class="dropdown-menu">
                            {#each Object.entries(nodesByCategory()) as [category, nodes]}
                                <div class="dropdown-category">
                                    <div class="category-header">{category}</div>
                                    {#each nodes as node}
                                        <button
                                            onclick={() => addNodeFromDropdown(node)}
                                            class="dropdown-item"
                                            title={node.description}
                                        >
                                            <span class="node-title">{node.title}</span>
                                            <span class="node-description">{node.description}</span>
                                        </button>
                                    {/each}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
                
                <button
                    onclick={() => {
                        openNodeSearch();
                    }}
                    class="control-btn"
                    title="Search all nodes (Tab)"
                >
                    <Plus class="w-4 h-4" />
                    Search Nodes <small>(Tab)</small>
                </button>
                
                <!-- DISABLED: Clear button removed since execution panel is disabled
                {#if showExecutionPanel}
                    <button
                        onclick={clearExecutionLogs}
                        class="control-btn clear-btn"
                        title="Clear execution logs"
                    >
                        <X class="w-4 h-4" />
                        Clear
                    </button>
                {/if}
                -->
            </div>
        </Panel>
    </SvelteFlow>

    <!-- Node Search Modal -->
    <NodeSearch
        bind:isOpen={showNodeSearch}
        on:nodeSelected={handleNodeSelected}
        on:close={() => showNodeSearch = false}
        position={{x: '50vw', y: '20vw'}}
    />

    <!-- 
        EXECUTION PANEL DISABLED:
        The execution console/logger has been removed because it's not particularly helpful 
        right now and just clogs up the screen with verbose output. The execution still 
        works fine - we just don't show the logging panel anymore.
        
        When execution logging becomes more useful (e.g. with better structured output,
        error highlighting, step-by-step debugging, etc.), we can re-enable this panel.
    -->
    <!--
    {#if showExecutionPanel}
        <div class="execution-panel">
            <div class="execution-header">
                <h3>Flow Execution</h3>
                <button class="close-btn" onclick={() => showExecutionPanel = false}>
                    <X class="w-4 h-4" />
                </button>
            </div>
            <div class="execution-content">
                <div class="logs-section">
                    <h4>Execution Logs:</h4>
                    <div class="logs">
                        {#each executionLogs as log}
                            <div class="log-entry">{log}</div>
                        {/each}
                        {#if executionLogs.length === 0}
                            <div class="log-entry">No logs yet...</div>
                        {/if}
                    </div>
                </div>
                
                {#if selectedExecutionNode}
                    <div class="results-section">
                        <h4>Execution Status:</h4>
                        <div class="results">
                            <div class="result-entry">
                                <span>Target Node: {selectedExecutionNode}</span>
                                <span class="status" class:executing={isExecuting} class:completed={!isExecuting}>
                                    {isExecuting ? 'Running' : 'Completed'}
                                </span>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    -->
</div>

<style>
    .flowgraph-container {
        width: 100%;
        height: 100vh;
        position: relative;
    }


    .project-info {
        background: white;
        padding: 0.5rem;
        border-radius: 0.375rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: flex-start;
    }

    .controls-panel {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .control-btn {
        background: white;
        border: 1px solid #e5e7eb;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.875rem;
        color: #374151;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .control-btn:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #d1d5db;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .control-btn:active:not(:disabled) {
        transform: translateY(1px);
    }

    .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .execution-btn {
        background: #10b981;
        color: white;
        border-color: #059669;
    }

    .execution-btn:hover:not(:disabled) {
        background: #059669;
    }

    .execution-btn.executing {
        background: #f59e0b;
        border-color: #d97706;
        animation: pulse 2s infinite;
    }

    .clear-btn {
        background: #ef4444;
        color: white;
        border-color: #dc2626;
    }

    .clear-btn:hover {
        background: #dc2626;
    }

    .execution-panel {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        max-height: 300px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        z-index: 1000;
        overflow: hidden;
    }

    .execution-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }

    .execution-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        line-height: 1;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        color: #374151;
    }

    .execution-content {
        padding: 1rem;
        max-height: 200px;
        overflow-y: auto;
    }

    .logs-section, .results-section {
        margin-bottom: 1rem;
    }

    .logs-section h4, .results-section h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .logs {
        background: #f9fafb;
        border-radius: 0.375rem;
        padding: 0.5rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.75rem;
        max-height: 120px;
        overflow-y: auto;
    }

    .log-entry {
        margin-bottom: 0.25rem;
        color: #374151;
    }

    .results {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .result-entry {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
    }

    .status {
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status.completed {
        background: #d1fae5;
        color: #065f46;
    }

    .status.executing {
        background: #fef3c7;
        color: #92400e;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }

    /* Dropdown styles */
    .dropdown-btn {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .dropdown-btn :global(.rotate180) {
        transform: rotate(180deg);
        transition: transform 0.2s ease;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        min-width: 280px;
        max-height: 400px;
        overflow-y: auto;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        margin-top: 0.25rem;
    }

    .dropdown-category {
        border-bottom: 1px solid #f3f4f6;
    }

    .dropdown-category:last-child {
        border-bottom: none;
    }

    .category-header {
        padding: 0.75rem 1rem;
        background: #f9fafb;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        border-bottom: 1px solid #e5e7eb;
    }

    .dropdown-item {
        width: 100%;
        padding: 0.75rem 1rem;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s ease;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .dropdown-item:hover {
        background: #f3f4f6;
    }

    .node-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    .node-description {
        font-size: 0.75rem;
        color: #6b7280;
        line-height: 1.3;
    }

    .relative {
        position: relative;
    }
</style>