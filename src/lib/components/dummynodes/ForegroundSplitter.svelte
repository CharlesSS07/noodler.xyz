<script module lang="ts">
    import { type Node } from '@xyflow/svelte';
    import type { JimpInstance } from 'jimp';

    export type ForegroundSplitterType = Node<
        {
            input: {
                sourceImage?: JimpInstance;
                maskPrompt?: string;
            };
            output: {
                foregroundImage?: JimpInstance;
                backgroundMask?: JimpInstance;
                processingInfo?: Record<string, any>;
            };
        },
        'foreground-splitter'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    
    let { id, data }: NodeProps<ForegroundSplitterType> = $props();

    // Node settings
    let confidence = $state(0.8);
    let edgeSmoothing = $state(0.5);
    let backgroundBlur = $state(0.3);

    // Output
    let foregroundResult = $state('');
    let backgroundMask = $state('');
    let processingStatus = $state('ready');

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_foreground_splitter';
    });

    // Access input values
    let sourceImage = $derived(data.input?.sourceImage || '');
    let maskPrompt = $derived(data.input?.maskPrompt || '');

    // Process splitting when inputs change
    $effect(() => {
        if (sourceImage && maskPrompt) {
            processingStatus = 'processing';
            
            setTimeout(() => {
                foregroundResult = generateMockForeground();
                backgroundMask = generateMockMask();
                processingStatus = 'complete';
                
                data.output.foregroundImage = foregroundResult;
                data.output.backgroundMask = backgroundMask;
                data.output.processingInfo = {
                    confidence,
                    edgeSmoothing,
                    backgroundBlur,
                    timestamp: new Date().toISOString()
                };
            }, 2500);
        } else {
            processingStatus = 'ready';
            foregroundResult = '';
            backgroundMask = '';
        }
    });

    function generateMockForeground(): string {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d')!;
        
        // Create mock foreground (subject extracted)
        const gradient = ctx.createRadialGradient(200, 150, 0, 200, 150, 150);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.7, '#4ecdc4');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add "subject" shape
        ctx.globalAlpha = confidence;
        ctx.fillStyle = '#45b7d1';
        ctx.beginPath();
        ctx.ellipse(200, 150, 80, 120, 0, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas.toDataURL();
    }

    function generateMockMask(): string {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d')!;
        
        // Create mask (white = foreground, black = background)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(200, 150, 80, 120, 0, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas.toDataURL();
    }

    const nodeTitle = "Foreground Splitter";
    const nodeDescription = "AI-powered foreground/background separation using semantic segmentation";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="Foreground Splitter">
    <!-- Input Sockets -->
    <Handle 
        type="target"
        socketType="image/jimp"
        label="Source Image"
        socket_id="sourceImage"
        tooltip="Image to split into foreground/background"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Source Image</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Mask Prompt"
        socket_id="maskPrompt"
        tooltip="Describe what to extract as foreground"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Mask Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="splitter-content">
        <div class="settings-grid">
            <div class="setting">
                <label for="confidence">Confidence:</label>
                <input 
                    type="range" 
                    id="confidence"
                    bind:value={confidence} 
                    min="0.1" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{confidence}</span>
            </div>

            <div class="setting">
                <label for="smoothing">Edge Smoothing:</label>
                <input 
                    type="range" 
                    id="smoothing"
                    bind:value={edgeSmoothing} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{edgeSmoothing}</span>
            </div>

            <div class="setting">
                <label for="blur">Background Blur:</label>
                <input 
                    type="range" 
                    id="blur"
                    bind:value={backgroundBlur} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{backgroundBlur}</span>
            </div>
        </div>

        <div class="status-display">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    ✂️ Ready to Split
                {:else if processingStatus === 'processing'}
                    🔄 Extracting Foreground...
                {:else}
                    ✅ Split Complete
                {/if}
            </div>
        </div>

        {#if foregroundResult && backgroundMask}
            <div class="results-preview">
                <h4>Split Results:</h4>
                <div class="result-grid">
                    <div class="result-item">
                        <h5>Foreground</h5>
                        <img src={foregroundResult} alt="Extracted foreground" />
                    </div>
                    <div class="result-item">
                        <h5>Mask</h5>
                        <img src={backgroundMask} alt="Background mask" />
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Output Sockets -->
    <Handle 
        type="source"
        socketType="image/jimp"
        label="Foreground"
        socket_id="foregroundImage"
        tooltip="Extracted foreground subject"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Foreground</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
    
    <Handle 
        type="source"
        socketType="image/jimp"
        label="Background Mask"
        socket_id="backgroundMask"
        tooltip="Mask for background generation"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Background Mask</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
</NodeWrapper>

<style>
    .splitter-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .settings-grid {
        display: grid;
        gap: 0.75rem;
    }

    .setting {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
    }

    .setting label {
        font-weight: 500;
        color: #374151;
        min-width: fit-content;
    }

    .setting input[type="range"] {
        flex: 1;
        min-width: 60px;
    }

    .value {
        font-weight: 600;
        color: #4b5563;
        min-width: 2rem;
        text-align: right;
    }

    .status-display {
        text-align: center;
    }

    .status-indicator {
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status-indicator.ready {
        background: #e5e7eb;
        color: #4b5563;
    }

    .status-indicator.processing {
        background: #fef3c7;
        color: #92400e;
        animation: pulse 2s infinite;
    }

    .status-indicator.complete {
        background: #d1fae5;
        color: #065f46;
    }

    .results-preview {
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .results-preview h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
    }

    .result-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .result-item h5 {
        margin: 0 0 0.25rem 0;
        font-size: 0.625rem;
        font-weight: 600;
        color: #6b7280;
        text-align: center;
    }

    .result-item img {
        width: 100%;
        max-height: 100px;
        object-fit: contain;
        border-radius: 0.25rem;
        border: 1px solid #e5e7eb;
    }

    .socket-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .input-content {
        align-items: flex-start;
        text-align: left;
    }

    .output-content {
        align-items: flex-end;
        text-align: right;
    }

    .socket-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
    }

    .socket-type {
        font-size: 0.625rem;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.8;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
</style>