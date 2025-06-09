<script lang="ts">
    import {
        Background,
        BackgroundVariant,
        type ColorMode,
        Controls,
        type Edge,
        MiniMap,
        type Node, Position,
        SvelteFlow,
        useSvelteFlow
    } from "@xyflow/svelte";
    import '@xyflow/svelte/dist/style.css';
    import NoteNode from "../../nodes/NoteNode.svelte";
    import StemNode from "$lib/components/StemNode.svelte";
    import ImageNode from "../../nodes/images/ImageNode.svelte";
    import HTMLRendererNode from "../../nodes/html/HTMLRendererNode.svelte";
    import TextTemplateFillinNode from "../../nodes/text/TextTemplateFillinNode.svelte";
    import TextEditorNode from "../../nodes/text/TextEditorNode.svelte";
    import RawTextEditor from "../../nodes/text/RawTextEditor.svelte";
    import MagicTextTransformLLM from "../dummynodes/TextFormatterLLM.svelte";
    import "../../nodes.css";
    import ELK from 'elkjs/lib/elk.bundled.js';
    import { onMount } from "svelte";
    import {edgesVersion2, nodesVersion0, nodesVersion2} from "./projectVersions";
    import Logo from "../../../../components/Logo.svelte";
    import EmailSignup from "../../../../components/EmailSignup.svelte";
    import BugReportButton from "../../../../components/BugReportButton.svelte";
    import { Play, RefreshCw, Download, ArrowLeft } from "lucide-svelte";
    import { Panel } from "@xyflow/svelte";

    let nodes = $state.raw<Node[]>(nodesVersion2);

    let edges = $state.raw<Edge[]>([]);

    const nodeTypes = {
        note: NoteNode,
        node: StemNode, // a node which takes on the properties stored by the server
        image: ImageNode,
        html: HTMLRendererNode,
        textTemplate: TextTemplateFillinNode,
        textEditor: TextEditorNode,
        textEditorRaw: RawTextEditor,
        textTransformLLM: MagicTextTransformLLM
    };

    let colorMode: ColorMode = $state('light');
    let isProcessing = $state(false);

    const elk = new ELK();

    const elkOptions = {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.layered.spacing.nodeNodeBetweenLayers': '100',
        'elk.spacing.componentComponent': '100',
        'elk.spacing.nodeNode': '70',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX', // Changed for better crossing minimization
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.layered.compaction.strategy': 'CHANNEL_DECOMPOSITION', // Added compaction strategy
        'elk.portConstraints': 'FIXED_POS', // Crucial for explicit port usage
    };

    function getLayoutedElements(nodes: Node[], edges: Edge[], options = {}) {
        const isHorizontal = options?.['elk.direction'] === 'RIGHT';
        const graph = {
            id: 'root',
            layoutOptions: options,
            children: nodes.map((node) => ({
                ...node,
                width: node.width,
                height: node.height,
                // These are now more important due to 'elk.portConstraints': 'FIXED_POS'
                targetPosition: isHorizontal ? Position.Left : Position.Top,
                sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            })),
            edges: edges.map((edge) => ({
                ...edge,
                // Ensure ELK knows about the source and target positions for better routing
                // These should generally align with the node's source/targetPosition
                source: edge.source,
                target: edge.target,
                sourcePort: edge.sourceHandle || 'default', // Add a default if not specified
                targetPort: edge.targetHandle || 'default', // Add a default if not specified
            })),
        };

        return elk
            .layout(graph)
            .then((layoutedGraph) => {
                return {
                    nodes: layoutedGraph.children.map((node) => ({
                        ...node,
                        position: { x: node.x, y: node.y },
                    })),
                    edges: layoutedGraph.edges,
                };
            })
            .catch(console.error);
    }

    function onLayout(direction: string) {
        const opts = { 'elk.direction': direction, ...elkOptions };

        // Before laying out, ensure nodes have their final rendered dimensions.
        // This is a common challenge with ELK and SvelteFlow.
        // A more robust solution might involve observing node dimensions after SvelteFlow renders.
        // For this example, we've hardcoded dimensions, but in a dynamic app, you'd get them from the DOM.

        getLayoutedElements(nodes, edges, opts).then(
            ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                nodes = layoutedNodes;
                edges = layoutedEdges;
            },
        );
    }

    let svelteFlowInstance; // Bind this to the SvelteFlow component

    onMount(() => {
        // We need to wait for SvelteFlow to render the nodes so their dimensions are available.
        // For a more dynamic solution, you might consider using onNodesChange or a mutation observer
        // to detect when nodes have finished rendering and then trigger the layout.
        // However, for a fixed set of nodes, a simple setTimeout after SvelteFlow initializes
        // is often sufficient to let the initial render pass.
        // The on:init event is a good place to start, but the actual dimensions might not be set immediately.
        // Let's rely on a slightly delayed layout after init.
        setTimeout(() => {
            handleFlowInit();
        }, 200);
    });


    function handleFlowInit() {
        console.log('SvelteFlow has initialized!');
        // After SvelteFlow initializes, we can attempt to get node dimensions.
        // However, for this to work correctly, your custom Svelte nodes (`NoteNode`, `StemNode`, etc.)
        // would need to expose their rendered `width` and `height` properties in a way that SvelteFlow
        // can capture or that you can query from the DOM.
        // Since we've hardcoded dimensions in the `nodes` array for this example,
        // we can directly proceed with the layout.
        edges = edgesVersion2;
        // onLayout('RIGHT');
    }

    function runWorkflow() {
        isProcessing = true;
        // Simulate workflow execution
        setTimeout(() => {
            isProcessing = false;
            alert('Prompt design workflow completed! Check the output nodes.');
        }, 2500);
    }

    function resetWorkflow() {
        // Reset all nodes to initial state
        nodes = [...nodesVersion2]; // Trigger reactivity
        edges = [...edgesVersion2];
        alert('Workflow reset to initial state.');
    }

    function exportResult() {
        alert('Export functionality would save the generated prompts and templates.');
    }

    function goBack() {
        window.location.href = '/app/demos';
    }

</script>
<div style="height: 100vh;">
<!--    <button on:click={() => {console.log(nodes, edges);}}>Print Node State</button>-->
    <SvelteFlow bind:nodes bind:edges {nodeTypes} {colorMode} fitView bind:this={svelteFlowInstance}>
        <Controls/>
        <Background variant={BackgroundVariant.Dots}/>
        <MiniMap/>

        <!-- Header Panel -->
        <Panel position="top-left">
            <div class="header-panel">
                <div class="header-content">
                    <Logo></Logo>

                    <h1>Prompt Design Studio</h1>
                    <p>Visual prompt engineering and template composition</p>
                </div>
            </div>
        </Panel>

        <!-- Control Panel -->
        <Panel position="top-right">
            <div class="controls-panel">
                <BugReportButton size="md" />
                
                <button 
                    onclick={goBack}
                    class="control-btn back-btn"
                    title="Back to Demos"
                >
                    <ArrowLeft class="btn-icon" />
                    Back
                </button>
                
                <button 
                    onclick={runWorkflow}
                    class="control-btn run-btn"
                    class:processing={isProcessing}
                    disabled={true || isProcessing}
                    title="Run Complete Workflow"
                >
                    <Play class="btn-icon" />
                    {isProcessing ? 'Processing...' : 'Run Workflow'}
                </button>
                
                <button 
                    onclick={resetWorkflow}
                    class="control-btn reset-btn"
                    title="Reset Workflow"
                >
                    <RefreshCw class="btn-icon" />
                    Reset
                </button>
            </div>
        </Panel>
    </SvelteFlow>

    <!-- Email Signup -->
    <div class="email-signup-container">
        <EmailSignup
                title="Get Early Access"
                subtitle="Be the first to access our prompt design tools"
                buttonText="Join Waitlist"
        />
    </div>
</div>

<style>
    .header-panel {
        background: rgba(255, 255, 255, 0.95);
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .email-signup-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        transform: scale(0.8);
        transform-origin: bottom right;
    }

    .header-content {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .header-content h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .header-content p {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
    }

    .controls-panel {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .control-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        background: rgba(255, 255, 255, 0.95);
        color: #374151;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
    }

    .control-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .control-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .back-btn {
        background: rgba(107, 114, 128, 0.9);
        color: white;
    }

    .back-btn:hover:not(:disabled) {
        background: rgba(75, 85, 99, 0.9);
    }

    .run-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }

    .run-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #059669, #047857);
    }

    .run-btn.processing {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        animation: pulse 2s infinite;
    }

    .reset-btn {
        background: rgba(239, 68, 68, 0.9);
        color: white;
    }

    .reset-btn:hover:not(:disabled) {
        background: rgba(220, 38, 38, 0.9);
    }

    .export-btn {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
    }

    .export-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #7c3aed, #6d28d9);
    }

    :global(.btn-icon) {
        width: 1rem;
        height: 1rem;
    }

    .info-panel {
        background: rgba(255, 255, 255, 0.95);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 300px;
    }

    .info-content h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.75rem 0;
    }

    .info-content ol {
        font-size: 0.75rem;
        color: #4b5563;
        margin: 0;
        padding-left: 1.25rem;
        line-height: 1.5;
    }

    .info-content li {
        margin-bottom: 0.25rem;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }

    @media (max-width: 768px) {
        .controls-panel {
            flex-direction: column;
        }
        
        .header-content h1 {
            font-size: 1.25rem;
        }
        
        .info-panel {
            max-width: 250px;
        }
    }
</style>