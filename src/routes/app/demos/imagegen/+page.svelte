<script lang="ts">
    import {
        Background,
        BackgroundVariant,
        type ColorMode,
        Controls,
        type Edge,
        MiniMap,
        type Node,
        SvelteFlow,
        Panel
    } from "@xyflow/svelte";
    import '@xyflow/svelte/dist/style.css';
    import NoteNode from "../../nodes/NoteNode.svelte";
    import StemNode from "$lib/components/StemNode.svelte";
    import ImageNode from "../../nodes/images/ImageNode.svelte";
    import HTMLRendererNode from "../../nodes/html/HTMLRendererNode.svelte";
    import TextTemplateFillinNode from "../../nodes/text/TextTemplateFillinNode.svelte";
    import TextEditorNode from "../../nodes/text/TextEditorNode.svelte";

    // Import our custom demo nodes
    import ImagePromptComposer from "../dummynodes/ImagePromptComposer.svelte";
    import ForegroundSplitter from "../dummynodes/ForegroundSplitter.svelte";
    import BackgroundGenerator from "../dummynodes/BackgroundGenerator.svelte";
    import SmartCompositor from "../dummynodes/SmartCompositor.svelte";
    import CompositeGenerator from "../dummynodes/CompositeGenerator.svelte";
    import StringToImageConverter from "../dummynodes/StringToImageConverter.svelte";
    import EmailSignup from "../../../../components/EmailSignup.svelte";
    
    import "../../nodes.css";
    import { onMount } from "svelte";
    import Logo from "../../../../components/Logo.svelte";
    import { Play, RefreshCw, Download, ArrowLeft, Layout } from "lucide-svelte";
    import RawTextEditor from "../../nodes/text/RawTextEditor.svelte";
    import ELK from 'elkjs/lib/elk.bundled.js';
    import { Position } from "@xyflow/svelte";

    // Demo workflow nodes
    let nodes = $state.raw<Node[]>([
        {
            id: 'welcome-note',
            type: 'note',
            position: { x: 50, y: 50 },
            data: {
                markdown: `# 🎨 AI Image Generation Lab

Advanced AI-powered image manipulation workflow:

1. **Fetch Image**: Load image from URL using official fetch node
2. **Split Subject**: Separate foreground focus from background
3. **Generate Background**: Create new background with AI diffusion
4. **Smart Composition**: Intelligently blend foreground with new background
5. **Save & Share**: Export to Google Drive and send via email

This demo showcases real-world AI image processing capabilities!`
            },
            width: 350,
            height: 200
        },
        {
            id: 'image-url-input',
            type: 'textEditorRaw',
            position: { x: 50, y: 300 },
            data: {
                input: { text: '' },
                currentText: 'https://example.com/sample-photo.jpg',
                output: { text: '' }
            },
            width: 200,
            height: 100
        },
        {
            id: 'fetch-url-node',
            type: 'node',
            position: { x: 300, y: 280 },
            data: {
                nid: 'official_node_fetch_url',
                input: {},
                output: {}
            },
            width: 200,
            height: 150
        },
        {
            id: 'string-to-image-converter',
            type: 'stringToImageConverter',
            position: { x: 550, y: 260 },
            data: {},
            width: 250,
            height: 320
        },
        {
            id: 'loaded-image-preview',
            type: 'image',
            position: { x: 850, y: 240 },
            data: {
                output: { image: null },
                input: { image: null }
            },
            width: 200,
            height: 150
        },
        {
            id: 'mask-prompt',
            type: 'textEditorRaw',
            position: { x: 50, y: 450 },
            data: {
                input: { text: '' },
                currentText: 'person, subject, main focus',
                output: { text: '' }
            },
            width: 200,
            height: 100
        },
        {
            id: 'foreground-splitter',
            type: 'foregroundSplitter',
            position: { x: 800, y: 300 },
            data: {},
            width: 300,
            height: 400
        },
        {
            id: 'background-style',
            type: 'textEditorRaw',
            position: { x: 50, y: 600 },
            data: {
                input: { text: '' },
                currentText: 'futuristic cyberpunk cityscape',
                output: { text: '' }
            },
            width: 200,
            height: 100
        },
        {
            id: 'background-details',
            type: 'textEditorRaw',
            position: { x: 50, y: 750 },
            data: {
                input: { text: '' },
                currentText: 'neon lights, rain, night atmosphere',
                output: { text: '' }
            },
            width: 200,
            height: 100
        },
        {
            id: 'prompt-template',
            type: 'textTemplate',
            position: { x: 300, y: 600 },
            data: {
                input: { text: '' },
                template: 'A detailed @backgroundstyle with @backgrounddetails, @qualitysettings, professional photography',
                output: { text: '' }
            },
            width: 300,
            height: 150
        },
        {
            id: 'quality-settings',
            type: 'textEditorRaw',
            position: { x: 50, y: 900 },
            data: {
                input: { text: '' },
                currentText: '8k resolution, dramatic lighting',
                output: { text: '' }
            },
            width: 200,
            height: 100
        },
        {
            id: 'background-generator',
            type: 'backgroundGenerator',
            position: { x: 1150, y: 300 },
            data: {},
            width: 320,
            height: 450
        },
        {
            id: 'composition-prompt',
            type: 'textEditorRaw',
            position: { x: 50, y: 1050 },
            data: {
                input: { text: '' },
                currentText: 'realistic lighting, natural shadows, seamless integration',
                output: { text: '' }
            },
            width: 200,
            height: 100
        },
        {
            id: 'smart-compositor',
            type: 'smartCompositor',
            position: { x: 1520, y: 350 },
            data: {},
            width: 320,
            height: 400
        },
        {
            id: 'final-result',
            type: 'image',
            position: { x: 1890, y: 400 },
            data: {
                output: { image: null },
                input: { image: null }
            },
            width: 250,
            height: 200
        },
        {
            id: 'workflow-info',
            type: 'note',
            position: { x: 1400, y: 50 },
            data: {
                markdown: `## 🔄 Advanced AI Pipeline

This workflow demonstrates professional AI image processing:

1. **Fetch URL** → Load image from web using official fetch node
2. **Split Subject** → AI-powered foreground/background separation
3. **Generate Background** → Create new backgrounds with diffusion AI
4. **Smart Composite** → Intelligent blending with lighting/shadow matching
5. **Save & Share** → Export to Google Drive and email delivery

Each step uses state-of-the-art AI models for professional-quality results.

**Features**: Semantic segmentation, diffusion generation, intelligent compositing, cloud integration.`
            },
            width: 350,
            height: 300
        }
    ]);

    let edges = $state.raw<Edge[]>([]); // Start with empty edges
    
    // Define the edges that will be added after mount
    const targetEdges: Edge[] = [
        // Connect URL input to fetch node
        { id: 'e1', source: 'image-url-input', target: 'fetch-url-node', sourceHandle: 'output', targetHandle: 'url' },
        
        // Connect fetch to string converter
        { id: 'e2', source: 'fetch-url-node', target: 'string-to-image-converter', sourceHandle: 'text', targetHandle: 'imageString' },
        
        // Connect converter to image preview
        { id: 'e3', source: 'string-to-image-converter', target: 'loaded-image-preview', sourceHandle: 'jimpImage', targetHandle: 'image' },
        
        // Connect to foreground splitter
        { id: 'e4', source: 'string-to-image-converter', target: 'foreground-splitter', sourceHandle: 'jimpImage', targetHandle: 'sourceImage' },
        { id: 'e5', source: 'mask-prompt', target: 'foreground-splitter', sourceHandle: 'output', targetHandle: 'maskPrompt' },
        
        // Connect background prompt composition
        { id: 'e6', source: 'background-style', target: 'prompt-template', sourceHandle: 'output', targetHandle: 'backgroundstyle' },
        { id: 'e7', source: 'background-details', target: 'prompt-template', sourceHandle: 'output', targetHandle: 'backgrounddetails' },
        { id: 'e8', source: 'quality-settings', target: 'prompt-template', sourceHandle: 'output', targetHandle: 'qualitysettings' },
        
        // Connect to background generator
        { id: 'e9', source: 'prompt-template', target: 'background-generator', sourceHandle: 'output', targetHandle: 'backgroundPrompt' },
        { id: 'e10', source: 'foreground-splitter', target: 'background-generator', sourceHandle: 'backgroundMask', targetHandle: 'backgroundMask' },
        
        // Connect to smart compositor
        { id: 'e11', source: 'foreground-splitter', target: 'smart-compositor', sourceHandle: 'foregroundImage', targetHandle: 'foregroundImage' },
        { id: 'e12', source: 'background-generator', target: 'smart-compositor', sourceHandle: 'generatedBackground', targetHandle: 'backgroundImage' },
        { id: 'e13', source: 'composition-prompt', target: 'smart-compositor', sourceHandle: 'output', targetHandle: 'compositionPrompt' },
        
        // Connect to final result
        { id: 'e14', source: 'smart-compositor', target: 'final-result', sourceHandle: 'compositeResult', targetHandle: 'image' }
    ];

    const nodeTypes = {
        note: NoteNode,
        node: StemNode,
        image: ImageNode,
        html: HTMLRendererNode,
        textTemplate: TextTemplateFillinNode,
        markdownTextEditor: TextEditorNode,
        textEditorRaw: RawTextEditor,
        stringToImageConverter: StringToImageConverter,
        foregroundSplitter: ForegroundSplitter,
        backgroundGenerator: BackgroundGenerator,
        smartCompositor: SmartCompositor,
        compositeGenerator: CompositeGenerator
    };

    let colorMode: ColorMode = $state('light');
    let isProcessing = $state(false);
    
    const elk = new ELK();

    const elkOptions = {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.layered.spacing.nodeNodeBetweenLayers': '120',
        'elk.spacing.componentComponent': '80',
        'elk.spacing.nodeNode': '100',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
    };

    function runWorkflow() {
        isProcessing = true;
        // Simulate workflow execution
        setTimeout(() => {
            isProcessing = false;
            alert('Workflow completed! Check the final result node.');
        }, 3000);
    }

    function resetWorkflow() {
        // Reset all nodes to initial state
        nodes = [...nodes]; // Trigger reactivity
        alert('Workflow reset to initial state.');
    }

    function exportResult() {
        alert('Export functionality would download the final generated image.');
    }

    function goBack() {
        window.location.href = '/app/demos';
    }

    function getLayoutedElements(nodes: Node[], edges: Edge[], options = {}) {
        const isHorizontal = options?.['elk.direction'] === 'RIGHT';
        const graph = {
            id: 'root',
            layoutOptions: options,
            children: nodes.map((node) => ({
                ...node,
                width: node.width || 200,
                height: node.height || 150,
                targetPosition: isHorizontal ? Position.Left : Position.Top,
                sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            })),
            edges: edges.map((edge) => ({
                ...edge,
                source: edge.source,
                target: edge.target,
                sourcePort: edge.sourceHandle || 'default',
                targetPort: edge.targetHandle || 'default',
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

    async function autoLayout() {
        const layouted = await getLayoutedElements(nodes, edges, elkOptions);
        if (layouted) {
            nodes = layouted.nodes;
            edges = [...edges]; // Trigger reactivity
        }
    }

    // Auto-layout nodes on initial load and connect edges after delay
    onMount(() => {
        // Wait for TextTemplate nodes to generate their dynamic sockets
        setTimeout(() => {
            edges = targetEdges; // Add all the edges after template sockets are ready
        }, 1000);
        
        // Auto-layout after edges are added
        setTimeout(() => {
            autoLayout();
        }, 1200);
    });
</script>

<div class="demo-container">
    <SvelteFlow 
        bind:nodes 
        bind:edges 
        {nodeTypes} 
        {colorMode} 
        fitView
        fitViewOptions={{ padding: 50 }}
    >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />

        <!-- Header Panel -->
        <Panel position="top-left">
            <div class="header-panel">
                <div class="header-content">
                    <Logo size={2} />
                    <h1>AI Image Generation Lab</h1>
                    <p>Advanced image generation and manipulation workflow</p>
                </div>
            </div>
        </Panel>

        <!-- Control Panel -->
        <Panel position="top-right">
            <div class="controls-panel">
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
                    disabled={isProcessing}
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
                
                <button 
                    onclick={autoLayout}
                    class="control-btn layout-btn"
                    title="Auto Layout Nodes"
                >
                    <Layout class="btn-icon" />
                    Auto Layout
                </button>
                
                <button 
                    onclick={exportResult}
                    class="control-btn export-btn"
                    title="Export Result"
                >
                    <Download class="btn-icon" />
                    Export
                </button>
            </div>
        </Panel>

    </SvelteFlow>

    <!-- Email Signup -->
    <div class="email-signup-container">
        <EmailSignup 
            title="Get Early Access"
            subtitle="Be the first to access our advanced AI image tools"
            buttonText="Join Waitlist"
            scale={0.8}
        />
    </div>
</div>

<style>
    .demo-container {
        width: 100%;
        height: 100vh;
        background: #f8fafc;
    }

    .header-panel {
        background: rgba(255, 255, 255, 0.95);
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
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

    .layout-btn {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
    }

    .layout-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #d97706, #b45309);
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

    .email-signup-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        transform: scale(0.8);
        transform-origin: bottom right;
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

        .email-signup-container {
            bottom: 10px;
            right: 10px;
            transform: scale(0.7);
        }
    }
</style>