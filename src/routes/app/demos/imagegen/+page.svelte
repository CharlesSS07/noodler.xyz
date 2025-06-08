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
    import ImageLoader from "../dummynodes/ImageLoader.svelte";
    import StyleTransferNode from "../dummynodes/StyleTransferNode.svelte";
    import InpaintingNode from "../dummynodes/InpaintingNode.svelte";
    
    import "../../nodes.css";
    import { onMount } from "svelte";
    import Logo from "../../../../components/Logo.svelte";
    import { Play, RefreshCw, Download, ArrowLeft } from "lucide-svelte";
    import RawTextEditor from "../../nodes/text/RawTextEditor.svelte";

    // Demo workflow nodes
    let nodes = $state.raw<Node[]>([
        {
            id: 'welcome-note',
            type: 'note',
            position: { x: 50, y: 50 },
            data: {
                markdown: `# 🎨 AI Image Generation Lab

Welcome to the advanced image generation and manipulation demo! This workflow showcases:

- **Prompt Composition**: Build sophisticated prompts from multiple components
- **Image Loading**: Import images from files or URLs  
- **Style Transfer**: Apply artistic styles using AI diffusion models
- **Inpainting**: Fill, replace, or extend parts of images
- **Composite Processing**: Chain multiple AI operations together

Connect the nodes below to create your own image generation pipeline!`
            },
            width: 350,
            height: 200
        },
        {
            id: 'base-prompt',
            type: 'textEditor',
            position: { x: 50, y: 300 },
            data: {
                content: 'A majestic mountain landscape at sunset'
            },
            width: 200,
            height: 100
        },
        {
            id: 'style-modifiers',
            type: 'textEditor', 
            position: { x: 50, y: 450 },
            data: {
                content: 'ethereal mist, dramatic lighting, golden hour'
            },
            width: 200,
            height: 100
        },
        {
            id: 'quality-settings',
            type: 'textEditor',
            position: { x: 50, y: 600 },
            data: {
                content: '8k resolution, award winning photography'
            },
            width: 200,
            height: 100
        },
        {
            id: 'prompt-composer',
            type: 'imagePromptComposer',
            position: { x: 350, y: 400 },
            data: {},
            width: 280,
            height: 400
        },
        {
            id: 'source-image-loader',
            type: 'imageLoader',
            position: { x: 50, y: 750 },
            data: {},
            width: 250,
            height: 300
        },
        {
            id: 'style-reference-loader',
            type: 'imageLoader',
            position: { x: 350, y: 750 },
            data: {},
            width: 250,
            height: 300
        },
        {
            id: 'style-transfer',
            type: 'styleTransfer',
            position: { x: 700, y: 400 },
            data: {},
            width: 300,
            height: 450
        },
        {
            id: 'inpainting',
            type: 'inpainting',
            position: { x: 1050, y: 400 },
            data: {},
            width: 300,
            height: 500
        },
        {
            id: 'final-result',
            type: 'image',
            position: { x: 1400, y: 500 },
            data: {
                src: '',
                alt: 'Final generated image'
            },
            width: 250,
            height: 200
        },
        {
            id: 'workflow-info',
            type: 'note',
            position: { x: 1400, y: 50 },
            data: {
                markdown: `## 🔄 Workflow Pipeline

This demo creates a complete image generation and manipulation pipeline:

1. **Compose Prompt** → Combine text elements into sophisticated prompt
2. **Load Images** → Import source and style reference images  
3. **Style Transfer** → Apply artistic style from reference to source
4. **Inpainting** → Fine-tune specific areas with AI inpainting
5. **Final Result** → Display the processed composite image

Try connecting different combinations to explore various creative possibilities!

**Pro Tip**: Use the style transfer node with different blend modes and the inpainting node to add specific elements or fix details.`
            },
            width: 350,
            height: 300
        }
    ]);

    let edges = $state.raw<Edge[]>([
        // Connect text inputs to prompt composer
        { id: 'e1', source: 'base-prompt', target: 'prompt-composer', sourceHandle: 'content', targetHandle: 'basePrompt' },
        { id: 'e2', source: 'style-modifiers', target: 'prompt-composer', sourceHandle: 'content', targetHandle: 'styleModifiers' },
        { id: 'e3', source: 'quality-settings', target: 'prompt-composer', sourceHandle: 'content', targetHandle: 'qualitySettings' },
        
        // Connect images to style transfer
        { id: 'e4', source: 'source-image-loader', target: 'style-transfer', sourceHandle: 'imageData', targetHandle: 'sourceImage' },
        { id: 'e5', source: 'style-reference-loader', target: 'style-transfer', sourceHandle: 'imageData', targetHandle: 'styleReference' },
        { id: 'e6', source: 'prompt-composer', target: 'style-transfer', sourceHandle: 'composedPrompt', targetHandle: 'prompt' },
        
        // Connect style transfer to inpainting
        { id: 'e7', source: 'style-transfer', target: 'inpainting', sourceHandle: 'processedImage', targetHandle: 'sourceImage' },
        { id: 'e8', source: 'prompt-composer', target: 'inpainting', sourceHandle: 'composedPrompt', targetHandle: 'inpaintPrompt' },
        
        // Connect inpainting to final result
        { id: 'e9', source: 'inpainting', target: 'final-result', sourceHandle: 'inpaintedImage', targetHandle: 'src' }
    ]);

    const nodeTypes = {
        note: NoteNode,
        node: StemNode,
        image: ImageNode,
        html: HTMLRendererNode,
        textTemplate: TextTemplateFillinNode,
        textEditor: TextEditorNode,
        textEditorRaw: RawTextEditor,
        imagePromptComposer: ImagePromptComposer,
        imageLoader: ImageLoader,
        styleTransfer: StyleTransferNode,
        inpainting: InpaintingNode
    };

    let colorMode: ColorMode = $state('light');
    let isProcessing = $state(false);

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
        <Panel position="top-center">
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
                    onclick={exportResult}
                    class="control-btn export-btn"
                    title="Export Result"
                >
                    <Download class="btn-icon" />
                    Export
                </button>
            </div>
        </Panel>

        <!-- Info Panel -->
        <Panel position="bottom-left">
            <div class="info-panel">
                <div class="info-content">
                    <h3>🎯 Quick Start</h3>
                    <ol>
                        <li>Upload images using the Image Loader nodes</li>
                        <li>Modify the text prompts to customize the generation</li>
                        <li>Adjust parameters in the Style Transfer and Inpainting nodes</li>
                        <li>Click "Run Workflow" to process the complete pipeline</li>
                        <li>View the final result in the Image node</li>
                    </ol>
                </div>
            </div>
        </Panel>
    </SvelteFlow>
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