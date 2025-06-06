<script lang="ts">
    import HTMLRendererNode from "./nodes/html/HTMLRendererNode.svelte";
    import { projectState, projectActions, projectSync } from '$lib/stores/ProjectState';
    
    let {project_key = 'project_key_not_assigned'} = $props<{ project_key?: string }>();

    import {
        SvelteFlow,
        Controls,
        Background,
        BackgroundVariant,
        MiniMap, 
        Panel,
        type Node,
        type Edge,
        type ColorMode
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    import NoteNode from './nodes/NoteNode.svelte';
    import StemNode from './StemNode.svelte';
    import TextTemplateFillinNode from "./nodes/text/TextTemplateFillinNode.svelte";
    import ImageNode from "./nodes/images/ImageNode.svelte";
    import TextEditorNode from "./nodes/text/TextEditorNode.svelte";
    import RawTextEditor from "./nodes/text/RawTextEditor.svelte";
    import { onMount, onDestroy } from "svelte";
    import Logo from "../../components/Logo.svelte";
    import { promptDesign } from "./lib/UnitTestProjects";
    import NodeSearch from "../../lib/components/NodeSearch.svelte";
    import { Plus } from "lucide-svelte";

    // Get nodes and edges from the project store
    let nodes = $derived($projectState.nodes);
    let edges = $derived($projectState.edges);

    // Node search state
    let showNodeSearch = $state(false);
    let searchPosition = $state({ x: 0, y: 0 });
    let flowContainer: HTMLDivElement;

    // Node type mappings
    const nodeTypes = {
        note: NoteNode,
        node: StemNode,
        textTemplate: TextTemplateFillinNode,
        image: ImageNode,
        textEditor: TextEditorNode,
        textEditorRaw: RawTextEditor,
        htmlRenderer: HTMLRendererNode
    };

    // Initialize project when component mounts
    onMount(() => {
        console.log('FlowGraph mounted with project_key:', project_key);
        if (project_key && project_key !== 'project_key_not_assigned') {
            // Check if we already have this project loaded
            if ($projectState.projectId !== project_key) {
                console.log('Starting project sync for:', project_key);
                projectSync.syncProject(project_key);
            }
        } else {
            // Load default project for demo purposes
            console.log('Loading demo data - no project key provided');
            projectActions.setNodes(promptDesign.nodes as Node[]);
            projectActions.setEdges(promptDesign.edges as Edge[]);
        }
    });

    // Clean up when component is destroyed
    onDestroy(() => {
        projectSync.cleanup();
    });

    // Handle flow changes
    function onNodesChange(event: any): void {
        console.log('onNodesChange called with event:', event);
        if (event && event.detail) {
            console.log('Event detail:', event.detail);
            projectActions.setNodes(event.detail);
        } else if (Array.isArray(event)) {
            console.log('Direct array of nodes:', event.length);
            projectActions.setNodes(event);
        }
    }

    function onEdgesChange(event: any): void {
        console.log('onEdgesChange called with event:', event);
        if (event && event.detail) {
            console.log('Event detail:', event.detail);
            projectActions.setEdges(event.detail);
        } else if (Array.isArray(event)) {
            console.log('Direct array of edges:', event.length);
            projectActions.setEdges(event);
        }
    }

    // Handle connection creation
    function onConnect(params: any): void {
        const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle
        };
        
        projectActions.setEdges([...edges, newEdge]);
    }

    // Delete selected elements
    function onDeleteKey(): void {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            const newNodes = nodes.filter(node => !node.selected);
            const newEdges = edges.filter(edge => !edge.selected);
            
            projectActions.setNodes(newNodes);
            projectActions.setEdges(newEdges);
        }
    }

    // Handle keyboard events
    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            onDeleteKey();
        } else if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            openNodeSearch(event);
        }
    }

    // Open node search
    function openNodeSearch(event?: KeyboardEvent | MouseEvent): void {
        console.log('openNodeSearch called');
        if (flowContainer) {
            const rect = flowContainer.getBoundingClientRect();
            searchPosition = {
                x: rect.width / 2,
                y: rect.height / 3
            };
        }
        showNodeSearch = true;
        console.log('showNodeSearch set to:', showNodeSearch);
    }

    // Handle node selection from search
    async function handleNodeSelected(event: CustomEvent<{ nodeId: string; title: string }>): Promise<void> {
        const { nodeId, title } = event.detail;
        showNodeSearch = false;

        // Create a new node instance from the blueprint
        await addNodeToFlow(nodeId, title);
    }

    // Add a node to the flow
    async function addNodeToFlow(blueprintId: string, title: string): Promise<void> {
        const newNode: Node = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'node', // Use StemNode for blueprint-based nodes
            position: {
                x: searchPosition.x - 100, // Center the node around search position
                y: searchPosition.y - 25
            },
            data: {
                nid: blueprintId,
                input: {},
                output: {},
                title: title
            }
        };

        projectActions.setNodes([...nodes, newNode]);
    }

    // Handle pane click to open node search
    function handlePaneClick({ event }: { event: MouseEvent }): void {
        // Only open search if clicking on empty space (not on nodes/edges)
        const target = event.target as HTMLElement;
        if (target.classList.contains('react-flow__pane')) {
            const rect = flowContainer.getBoundingClientRect();
            searchPosition = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            openNodeSearch();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flowgraph-container" bind:this={flowContainer}>
    <SvelteFlow
        {nodes}
        {edges}
        {nodeTypes}
        on:nodeschange={onNodesChange}
        on:edgeschange={onEdgesChange}
        on:connect={onConnect}
        on:paneclick={handlePaneClick}
        on:init={() => console.log('SvelteFlow initialized')}
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
            <button
                onclick={() => {
                    console.log('Button clicked!');
                    openNodeSearch();
                }}
                class="add-node-btn"
                title="Add Node (Tab)"
            >
                <Plus class="w-4 h-4" />
                Add Node
            </button>
        </Panel>
    </SvelteFlow>

    <!-- Node Search Modal -->
    <NodeSearch
        bind:isOpen={showNodeSearch}
        position={searchPosition}
        on:nodeSelected={handleNodeSelected}
        on:close={() => showNodeSearch = false}
    />
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

    .add-node-btn {
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

    .add-node-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .add-node-btn:active {
        transform: translateY(1px);
    }
</style>