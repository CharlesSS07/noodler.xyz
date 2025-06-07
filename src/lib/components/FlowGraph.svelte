<script lang="ts">
    import HTMLRendererNode from "../../routes/app/nodes/html/HTMLRendererNode.svelte";

    let {project_key = 'project_key_not_assigned'} = $props<{ project_key?: string }>();

    import {
        SvelteFlow,
        Controls,
        Background,
        BackgroundVariant,
        MiniMap, Panel,
        type Node,
        type Edge,
        type ColorMode
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    import NoteNode from '../../routes/app/nodes/NoteNode.svelte';
    import {auth, rtdb} from '../../firebase';
    import StemNode from '$lib/components/StemNode.svelte';
    import {onValue, ref, update, child, remove, off} from 'firebase/database';
    import TextTemplateFillinNode from "../../routes/app/nodes/text/TextTemplateFillinNode.svelte";
    import ImageNode from "../../routes/app/nodes/images/ImageNode.svelte";
    import TextEditorNode from "../../routes/app/nodes/text/TextEditorNode.svelte";
    import RawTextEditor from "../../routes/app/nodes/text/RawTextEditor.svelte";
    import {onMount} from "svelte";
    import Logo from "../../components/Logo.svelte";
    import NodeSearch from "./NodeSearch.svelte";
    import { Plus, Play } from "lucide-svelte";
    import {projectState} from "$lib/stores/ProjectState";
    import { DecentralizedFlowInterpreter } from "../../routes/app/lib/Interpreter";
    import { FirestoreNodeBluePrintController } from "../../routes/app/lib/FirestoreNodeBluePrint";

    let nodes = $state.raw<Node[]>([]);

    let edges = $state.raw<Edge[]>([]);

    // Firebase references - reactive to project_key changes
    let nodesRef = $derived(ref(rtdb, `fridge/${project_key}/nodes`));
    let edgesRef = $derived(ref(rtdb, `fridge/${project_key}/edges`));

    // Track if we're currently syncing to prevent infinite loops
    let isSyncingNodes = false;
    let isSyncingEdges = false;
    let firebaseNodesUnsubscribe: (() => void) | null = null;
    let firebaseEdgesUnsubscribe: (() => void) | null = null;

    // Maps to track previous states for change detection
    let previousNodes = new Map<string, Node>();
    let previousEdges = new Map<string, Edge>();

    // Helper function to deep compare nodes
    function nodesEqual(node1: Node, node2: Node): boolean {
        if (!node1 || !node2) return false;
        try {
            return JSON.stringify(node1) === JSON.stringify(node2);
        } catch (e) {
            console.warn('Error comparing nodes:', e);
            return false;
        }
    }

    // Helper function to deep compare edges
    function edgesEqual(edge1: Edge, edge2: Edge): boolean {
        if (!edge1 || !edge2) return false;
        try {
            return JSON.stringify(edge1) === JSON.stringify(edge2);
        } catch (e) {
            console.warn('Error comparing edges:', e);
            return false;
        }
    }

    // Helper function to convert Firebase data to Node array
    function firebaseDataToNodes(snapshot: any): Node[] {
        try {
            if (!snapshot || !snapshot.exists()) return [];

            const data = snapshot.val();
            if (!data || typeof data !== 'object') return [];

            return Object.entries(data)
                .map(([id, nodeData]: [string, any]) => {
                    if (!nodeData || typeof nodeData !== 'object') return null;
                    return {
                        id,
                        ...nodeData
                    };
                })
                .filter(Boolean) as Node[];
        } catch (error) {
            console.error('Error converting Firebase data to nodes:', error);
            return [];
        }
    }

    // Helper function to convert Firebase data to Edge array
    function firebaseDataToEdges(snapshot: any): Edge[] {
        try {
            if (!snapshot || !snapshot.exists()) return [];

            const data = snapshot.val();
            if (!data || typeof data !== 'object') return [];

            return Object.entries(data)
                .map(([id, edgeData]: [string, any]) => {
                    if (!edgeData || typeof edgeData !== 'object') return null;
                    return {
                        id,
                        ...edgeData
                    };
                })
                .filter(Boolean) as Edge[];
        } catch (error) {
            console.error('Error converting Firebase data to edges:', error);
            return [];
        }
    }

    // Sync local node changes to Firebase
    async function syncNodesToFirebase(localNodes: Node[]) {
        if (isSyncingNodes || !nodesRef) return;

        try {
            const currentNodeMap = new Map(localNodes.map(node => [node.id, node]));
            const updates: Record<string, Omit<Node, 'id'>> = {};
            const nodesToRemove: string[] = [];

            // Check for new or changed nodes
            for (const [id, node] of currentNodeMap) {
                if (!node || !node.id) continue;

                const previousNode = previousNodes.get(id);

                if (!previousNode || !nodesEqual(node, previousNode)) {
                    const {id: nodeId, ...nodeWithoutId} = node;
                    updates[id] = nodeWithoutId;
                }
            }

            // Check for removed nodes
            for (const [id] of previousNodes) {
                if (!currentNodeMap.has(id)) {
                    nodesToRemove.push(id);
                }
            }

            // Apply updates to Firebase
            if (Object.keys(updates).length > 0) {
                await update(nodesRef, updates);
            }

            // Remove deleted nodes
            for (const nodeId of nodesToRemove) {
                if (nodeId) {
                    await remove(child(nodesRef, nodeId));
                }
            }

            // Update our tracking map
            previousNodes = new Map(currentNodeMap);

        } catch (error) {
            console.error('Error syncing nodes to Firebase:', error);
        }
    }

    // Sync local edge changes to Firebase
    async function syncEdgesToFirebase(localEdges: Edge[]) {
        if (isSyncingEdges || !edgesRef) return;

        try {
            const currentEdgeMap = new Map(localEdges.map(edge => [edge.id, edge]));
            const updates: Record<string, any> = {};
            const edgesToRemove: string[] = [];

            // Check for new or changed edges
            for (const [id, edge] of currentEdgeMap) {
                if (!edge || !edge.id) continue;

                const previousEdge = previousEdges.get(id);

                if (!previousEdge || !edgesEqual(edge, previousEdge)) {
                    const {id: edgeId, ...edgeWithoutId} = edge;
                    updates[id] = edgeWithoutId;
                }
            }

            // Check for removed edges
            for (const [id] of previousEdges) {
                if (!currentEdgeMap.has(id)) {
                    edgesToRemove.push(id);
                }
            }

            // Apply updates to Firebase
            if (Object.keys(updates).length > 0) {
                await update(edgesRef, updates);
            }

            // Remove deleted edges
            for (const edgeId of edgesToRemove) {
                if (edgeId) {
                    await remove(child(edgesRef, edgeId));
                }
            }

            // Update our tracking map
            previousEdges = new Map(currentEdgeMap);

        } catch (error) {
            console.error('Error syncing edges to Firebase:', error);
        }
    }

    // Set up Firebase listener for nodes
    function setupFirebaseNodesListener() {
        if (firebaseNodesUnsubscribe) {
            firebaseNodesUnsubscribe();
        }

        const listener = (snapshot: any) => {
            if (isSyncingNodes) return;

            try {
                isSyncingNodes = true;

                const firebaseNodes = firebaseDataToNodes(snapshot);

                // Direct assignment with $state.raw
                // const localNodeMap = new Map(nodes.map(node => [node.id, node]));
                const firebaseNodeMap = new Map(firebaseNodes.map(node => [node.id, node]));

                // Start with existing local nodes
                const updatedNodes = [...nodes];

                // Update existing nodes or add new ones from Firebase
                for (const [id, firebaseNode] of firebaseNodeMap) {
                    const localNodeIndex = updatedNodes.findIndex(node => node.id === id);

                    if (localNodeIndex >= 0) {
                        // Update existing node if different
                        if (!nodesEqual(updatedNodes[localNodeIndex], firebaseNode)) {
                            updatedNodes[localNodeIndex] = firebaseNode;
                        }
                    } else {
                        // Add new node from Firebase
                        updatedNodes.push(firebaseNode);
                    }
                }

                // Remove nodes that no longer exist in Firebase
                const finalNodes = updatedNodes.filter(node => firebaseNodeMap.has(node.id));

                // Update our tracking map
                previousNodes = new Map(finalNodes.map(node => [node.id, node]));

                // Direct assignment to trigger reactivity
                nodes = finalNodes;

            } catch (error) {
                console.error('Error syncing from Firebase:', error);
            } finally {
                setTimeout(() => {
                    isSyncingNodes = false;
                }, 50);
            }
        };

        const errorHandler = (error: any) => {
            console.error('Firebase nodes listener error:', error);
        };

        onValue(nodesRef, listener, errorHandler);

        firebaseNodesUnsubscribe = () => {
            if (nodesRef) {
                off(nodesRef, 'value', listener);
            }
        };
    }

    // Set up Firebase listener for edges
    function setupFirebaseEdgesListener() {
        if (firebaseEdgesUnsubscribe) {
            firebaseEdgesUnsubscribe();
        }

        const listener = (snapshot: any) => {
            if (isSyncingEdges) return;

            try {
                isSyncingEdges = true;

                const firebaseEdges = firebaseDataToEdges(snapshot);

                // Direct assignment with $state.raw
                // const localEdgeMap = new Map(edges.map(edge => [edge.id, edge]));
                const firebaseEdgeMap = new Map(firebaseEdges.map(edge => [edge.id, edge]));

                // Start with existing local edges
                const updatedEdges = [...edges];

                // Update existing edges or add new ones from Firebase
                for (const [id, firebaseEdge] of firebaseEdgeMap) {
                    const localEdgeIndex = updatedEdges.findIndex(edge => edge.id === id);

                    if (localEdgeIndex >= 0) {
                        // Update existing edge if different
                        if (!edgesEqual(updatedEdges[localEdgeIndex], firebaseEdge)) {
                            updatedEdges[localEdgeIndex] = firebaseEdge;
                        }
                    } else {
                        // Add new edge from Firebase
                        updatedEdges.push(firebaseEdge);
                    }
                }

                // Remove edges that no longer exist in Firebase
                const finalEdges = updatedEdges.filter(edge => firebaseEdgeMap.has(edge.id));

                // Update our tracking map
                previousEdges = new Map(finalEdges.map(edge => [edge.id, edge]));

                // Direct assignment to trigger reactivity
                edges = finalEdges;

            } catch (error) {
                console.error('Error syncing edges from Firebase:', error);
            } finally {
                setTimeout(() => {
                    isSyncingEdges = false;
                }, 50);
            }
        };

        const errorHandler = (error: any) => {
            console.error('Firebase edges listener error:', error);
        };

        onValue(edgesRef, listener, errorHandler);

        firebaseEdgesUnsubscribe = () => {
            if (edgesRef) {
                off(edgesRef, 'value', listener);
            }
        };
    }

    // Watch for changes to nodes and sync to Firebase
    $effect(() => {
        if (nodes && nodes.length >= 0) {
            syncNodesToFirebase(nodes);
            // const timeoutId = setTimeout(() => { // no debouncing for now
            //    syncNodesToFirebase(nodes); // I want to see things moving in realtime
            // }, 10);
            //
            // return () => clearTimeout(timeoutId);
        }
    });

    // Watch for changes to edges and sync to Firebase
    $effect(() => {
        if (edges && edges.length >= 0) {
            const timeoutId = setTimeout(() => {
                syncEdgesToFirebase(edges);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    });

    // Watch for project_key changes and set up Firebase listeners
    $effect(() => {
        if (project_key && project_key !== 'project_key_not_assigned') {
            console.log('Setting up Firebase listeners for project:', project_key);
            setupFirebaseNodesListener();
            setupFirebaseEdgesListener();
        }

        // Cleanup function
        return () => {
            if (firebaseNodesUnsubscribe) {
                firebaseNodesUnsubscribe();
                firebaseNodesUnsubscribe = null;
            }
            if (firebaseEdgesUnsubscribe) {
                firebaseEdgesUnsubscribe();
                firebaseEdgesUnsubscribe = null;
            }
        };
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

    export function updateNode(nodeId: string, updates: Partial<Node>): void {
        if (!nodeId || !updates) return;

        try {
            nodes = nodes.map(node =>
                node && node.id === nodeId ? {...node, ...updates} : node
            );
        } catch (error) {
            console.error('Error updating node:', error);
        }
    }

    export function deleteNode(nodeId: string): void {
        if (!nodeId) return;

        try {
            nodes = nodes.filter(node => node && node.id !== nodeId);
        } catch (error) {
            console.error('Error deleting node:', error);
        }
    }

    // Helper functions for manual edge operations
    export function addEdge(edge: Omit<Edge, 'id'>): void {
        try {
            const newEdge: Edge = {
                id: crypto.randomUUID(),
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
        textEditor: TextEditorNode,
        textEditorRaw: RawTextEditor
    };

    let selectedNodeNID = $state('official_node_fetch_url');
    let colorMode: ColorMode = $state('light');

    // Node search state
    let showNodeSearch = $state(false);
    let searchPosition = $state({ x: 0, y: 0 });
    let flowContainer: HTMLDivElement;

    // Execution state
    let executionInterpreter: DecentralizedFlowInterpreter | null = null;
    let isExecuting = $state(false);
    let executionResults = $state<Record<string, any>>({});
    let executionLogs = $state<string[]>([]);

    // Node search functions
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
        await addNodeFromBlueprint(nodeId, title);
    }

    // Add a node to the flow from blueprint
    async function addNodeFromBlueprint(blueprintId: string, title: string): Promise<void> {
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

        addNode(newNode, newNode.id);
    }

    // Handle keyboard events
    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            deleteSelectedElements();
        } else if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            openNodeSearch(event);
        }
    }

    // Delete selected elements
    function deleteSelectedElements(): void {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            // Remove selected nodes
            selectedNodes.forEach(node => deleteNode(node.id));
            
            // Remove selected edges  
            selectedEdges.forEach(edge => {
                edges = edges.filter(e => e.id !== edge.id);
            });
        }
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

    // Handle connection creation
    function onConnect(params: any): void {
        const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle
        };
        
        addEdge(newEdge);
    }

    // Execution functions
    async function getFirestoreNodeBlueprint(nodeId: string, nodeData: any): Promise<FirestoreNodeBluePrintController | null> {
        try {
            // Get the node blueprint ID from the node data
            const blueprintId = nodeData.nid || nodeId;
            
            // Create a controller for this blueprint
            const controller = new FirestoreNodeBluePrintController(blueprintId);
            
            // Test if the blueprint exists by trying to get its title
            try {
                await controller.getTitle();
                return controller;
            } catch (error) {
                console.warn(`Blueprint not found for ${blueprintId}, creating fallback`);
                return null;
            }
        } catch (error) {
            console.error(`Error getting Firestore blueprint for ${nodeId}:`, error);
            return null;
        }
    }

    function createFallbackNodeBlueprint(nodeId: string, nodeData: any) {
        return {
            nid: nodeId,
            async call(inputs: Map<string, unknown>, outputs: any): Promise<void> {
                executionLogs = [...executionLogs, `Executing fallback node ${nodeId} with inputs: ${JSON.stringify(Object.fromEntries(inputs))}`];
                
                // Simple fallback execution - just pass through or echo
                const inputEntries = Object.fromEntries(inputs);
                
                if (Object.keys(inputEntries).length > 0) {
                    // If there are inputs, pass the first one as output
                    const firstValue = Object.values(inputEntries)[0];
                    await outputs.set('result', firstValue);
                } else {
                    // No inputs, return a simple result
                    await outputs.set('result', `Fallback result from ${nodeId}`);
                }
                
                executionLogs = [...executionLogs, `Fallback node ${nodeId} completed execution`];
            },
            async spinOffNode(): Promise<any> { throw new Error('Not implemented'); },
            async newInputSocket(): Promise<void> { throw new Error('Not implemented'); },
            async getInputSocketKeysInOrder(): Promise<Array<string>> { return Object.keys(nodeData.inputSockets || {}); },
            async newOutputSocket(): Promise<void> { throw new Error('Not implemented'); },
            async getOutputSocketKeysInOrder(): Promise<string[]> { return Object.keys(nodeData.outputSockets || {}); },
            async setDocumentation(): Promise<void> { throw new Error('Not implemented'); },
            async getDocumentation(): Promise<string> { return ''; },
            async setTitle(): Promise<void> { throw new Error('Not implemented'); },
            async getTitle(): Promise<string> { return nodeData.title || ''; },
            async setCode(): Promise<void> { throw new Error('Not implemented'); },
            async getCode(): Promise<string> { return ''; },
            async markAsUpdated(): Promise<void> { throw new Error('Not implemented'); },
            async getLastUpdatedTimestamp(): Promise<Date> { return new Date(); },
            async bumpVersion(): Promise<void> { throw new Error('Not implemented'); },
            async getVersion(): Promise<number> { return 1; },
            async updated(): Promise<void> { throw new Error('Not implemented'); }
        };
    }

    async function testExecution(): Promise<void> {
        if (isExecuting) return;
        
        isExecuting = true;
        executionLogs = ['Starting execution test...'];
        executionResults = {};
        
        try {
            // Create Firestore node blueprints for all nodes
            const nodeBlueprints = new Map();
            executionLogs = [...executionLogs, 'Loading node blueprints from Firestore...'];
            
            for (const node of nodes) {
                try {
                    const firestoreBlueprint = await getFirestoreNodeBlueprint(node.id, node.data);
                    if (firestoreBlueprint) {
                        nodeBlueprints.set(node.id, firestoreBlueprint);
                        executionLogs = [...executionLogs, `Loaded Firestore blueprint for ${node.id}`];
                    } else {
                        const fallbackBlueprint = createFallbackNodeBlueprint(node.id, node.data);
                        nodeBlueprints.set(node.id, fallbackBlueprint);
                        executionLogs = [...executionLogs, `Using fallback blueprint for ${node.id}`];
                    }
                } catch (error) {
                    console.error(`Error loading blueprint for ${node.id}:`, error);
                    const fallbackBlueprint = createFallbackNodeBlueprint(node.id, node.data);
                    nodeBlueprints.set(node.id, fallbackBlueprint);
                    executionLogs = [...executionLogs, `Error loading ${node.id}, using fallback`];
                }
            }
            
            // Initialize the interpreter
            executionInterpreter = new DecentralizedFlowInterpreter();
            
            // Add execution listener to track progress
            executionInterpreter.addExecutionListener((nodeId, status) => {
                executionLogs = [...executionLogs, `Node ${nodeId}: ${status}`];
                
                if (status === 'completed') {
                    const result = executionInterpreter?.getNodeExecutionStatus(nodeId);
                    if (result) {
                        executionResults = { ...executionResults, [nodeId]: result };
                    }
                }
            });
            
            // Initialize the flow
            executionInterpreter.initializeFlow(nodes, edges, nodeBlueprints);
            
            // Find start nodes (nodes with no incoming edges)
            const targetNodes = new Set(edges.map(edge => edge.target));
            const startNodes = nodes
                .filter(node => !targetNodes.has(node.id))
                .map(node => node.id);
            
            if (startNodes.length === 0) {
                // If no clear start nodes, use all nodes
                startNodes.push(...nodes.map(node => node.id));
            }
            
            executionLogs = [...executionLogs, `Starting execution with nodes: ${startNodes.join(', ')}`];
            
            // Start execution
            await executionInterpreter.startExecution(startNodes);
            
            executionLogs = [...executionLogs, 'Execution completed successfully!'];
            
        } catch (error) {
            console.error('Execution error:', error);
            executionLogs = [...executionLogs, `Execution error: ${error.message}`];
        } finally {
            isExecuting = false;
        }
    }

    function clearExecutionResults(): void {
        executionLogs = [];
        executionResults = {};
        if (executionInterpreter) {
            executionInterpreter.reset();
        }
    }

    onMount(() => {
        auth.authStateReady().then(() => {
            setTimeout(() => {
                const introNodeId = 'defaultIntroNodeId';
                if (nodes.length == 0) {
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
            }, 500);
        });
    });


</script>


<svelte:window onkeydown={handleKeydown} />

<div class="flowgraph-container" bind:this={flowContainer}>
    <SvelteFlow
        bind:nodes
        bind:edges
        {nodeTypes}
        onconnect={onConnect}
        onpaneclick={handlePaneClick}
        oninit={() => console.log('SvelteFlow initialized')}
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
                <button
                    onclick={() => {
                        openNodeSearch();
                    }}
                    class="control-btn"
                    title="Add Node (Tab)"
                >
                    <Plus class="w-4 h-4" />
                    Add Node
                </button>
                
                <button
                    onclick={testExecution}
                    class="control-btn execution-btn"
                    class:executing={isExecuting}
                    disabled={isExecuting || nodes.length === 0}
                    title="Test Execution"
                >
                    <Play class="w-4 h-4" />
                    {isExecuting ? 'Executing...' : 'Test Flow'}
                </button>
                
                {#if executionLogs.length > 0}
                    <button
                        onclick={clearExecutionResults}
                        class="control-btn clear-btn"
                        title="Clear Results"
                    >
                        Clear
                    </button>
                {/if}
            </div>
        </Panel>
    </SvelteFlow>

    <!-- Node Search Modal -->
    <NodeSearch
        bind:isOpen={showNodeSearch}
        position={searchPosition}
        on:nodeSelected={handleNodeSelected}
        on:close={() => showNodeSearch = false}
    />

    <!-- Execution Results Panel -->
    {#if executionLogs.length > 0}
        <div class="execution-panel">
            <div class="execution-header">
                <h3>Execution Results</h3>
                <button onclick={clearExecutionResults} class="close-btn">×</button>
            </div>
            
            <div class="execution-content">
                <div class="logs-section">
                    <h4>Execution Log:</h4>
                    <div class="logs">
                        {#each executionLogs as log}
                            <div class="log-entry">{log}</div>
                        {/each}
                    </div>
                </div>
                
                {#if Object.keys(executionResults).length > 0}
                    <div class="results-section">
                        <h4>Node Status:</h4>
                        <div class="results">
                            {#each Object.entries(executionResults) as [nodeId, result]}
                                <div class="result-entry">
                                    <strong>{nodeId}:</strong>
                                    <span class="status" class:completed={result.isCompleted} class:executing={result.isExecuting}>
                                        {result.isCompleted ? 'Completed' : result.isExecuting ? 'Executing' : 'Pending'}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
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
</style>