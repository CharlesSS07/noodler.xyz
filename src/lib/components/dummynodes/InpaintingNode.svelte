<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type InpaintingType = Node<
        {
            input: {
                sourceImage?: string;
                maskImage?: string;
                inpaintPrompt?: string;
            };
            output: {
                inpaintedImage?: string;
                processingInfo?: Record<string, any>;
            };
        },
        'inpainting-node'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    
    let { id, data }: NodeProps<InpaintingType> = $props();

    // Node settings
    let denoisingStrength = $state(0.75);
    let guidanceScale = $state(7.5);
    let steps = $state(30);
    let mode = $state('inpaint'); // inpaint, outpaint, replace

    // Output
    let inpaintedImage = $state('');
    let processingStatus = $state('ready');

    // Mask drawing
    let canvasRef: HTMLCanvasElement;
    let isDrawing = $state(false);
    let brushSize = $state(20);

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
    });

    // Access input values
    let sourceImage = $derived(data.input?.sourceImage || '');
    let maskImage = $derived(data.input?.maskImage || '');
    let inpaintPrompt = $derived(data.input?.inpaintPrompt || '');

    // Simulate inpainting processing
    $effect(() => {
        if (sourceImage && (maskImage || canvasRef) && inpaintPrompt) {
            processingStatus = 'processing';
            
            setTimeout(() => {
                inpaintedImage = generateMockInpaintResult();
                processingStatus = 'complete';
                data.output.inpaintedImage = inpaintedImage;
                data.output.processingInfo = {
                    denoisingStrength,
                    guidanceScale,
                    steps,
                    mode,
                    timestamp: new Date().toISOString()
                };
            }, 3000);
        } else {
            processingStatus = 'ready';
            inpaintedImage = '';
        }
    });

    function generateMockInpaintResult(): string {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d')!;
        
        // Create mock inpainted result
        const gradient = ctx.createRadialGradient(200, 150, 0, 200, 150, 200);
        gradient.addColorStop(0, '#ff9a9e');
        gradient.addColorStop(0.5, '#fecfef');
        gradient.addColorStop(1, '#fecfef');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some "inpainted" details based on mode
        ctx.globalAlpha = 0.8;
        if (mode === 'inpaint') {
            // Add circular "fixed" area
            ctx.fillStyle = '#4facfe';
            ctx.beginPath();
            ctx.arc(200, 150, 80, 0, Math.PI * 2);
            ctx.fill();
        } else if (mode === 'outpaint') {
            // Add extended borders
            ctx.fillStyle = '#00f2fe';
            ctx.fillRect(0, 0, 50, canvas.height);
            ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
        }
        
        return canvas.toDataURL();
    }

    function clearMask() {
        if (canvasRef) {
            const ctx = canvasRef.getContext('2d')!;
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
        }
    }

    function initCanvas() {
        if (canvasRef) {
            const ctx = canvasRef.getContext('2d')!;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    function startDrawing(event: MouseEvent) {
        isDrawing = true;
        draw(event);
    }

    function draw(event: MouseEvent) {
        if (!isDrawing || !canvasRef) return;
        
        const rect = canvasRef.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ctx = canvasRef.getContext('2d')!;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    const nodeTitle = "AI Inpainting";
    const nodeDescription = "Fill, replace, or extend parts of images using AI inpainting";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="AI Inpainting">
    <!-- Input Sockets -->
    <Handle 
        type="target"
        socketType="image"
        label="Source Image"
        socket_id="sourceImage"
        tooltip="Image to inpaint"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Source Image</span>
            <span class="socket-type">image</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="image"
        label="Mask Image"
        socket_id="maskImage"
        tooltip="Mask defining areas to inpaint"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Mask Image</span>
            <span class="socket-type">image</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Inpaint Prompt"
        socket_id="inpaintPrompt"
        tooltip="What to paint in masked areas"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Inpaint Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="inpaint-content">
        <div class="settings-section">
            <div class="setting">
                <label for="mode">Mode:</label>
                <select bind:value={mode} id="mode">
                    <option value="inpaint">Inpaint (Fill)</option>
                    <option value="outpaint">Outpaint (Extend)</option>
                    <option value="replace">Replace</option>
                </select>
            </div>

            <div class="setting">
                <label for="denoising">Denoising Strength:</label>
                <input 
                    type="range" 
                    id="denoising"
                    bind:value={denoisingStrength} 
                    min="0" 
                    max="1" 
                    step="0.05"
                />
                <span class="value">{denoisingStrength}</span>
            </div>

            <div class="setting">
                <label for="guidance">Guidance Scale:</label>
                <input 
                    type="range" 
                    id="guidance"
                    bind:value={guidanceScale} 
                    min="1" 
                    max="20" 
                    step="0.5"
                />
                <span class="value">{guidanceScale}</span>
            </div>

            <div class="setting">
                <label for="steps">Steps:</label>
                <input 
                    type="range" 
                    id="steps"
                    bind:value={steps} 
                    min="10" 
                    max="100" 
                    step="5"
                />
                <span class="value">{steps}</span>
            </div>
        </div>

        <div class="mask-editor">
            <h4>Draw Mask:</h4>
            <div class="brush-controls">
                <label for="brushSize">Brush Size:</label>
                <input 
                    type="range" 
                    id="brushSize"
                    bind:value={brushSize} 
                    min="5" 
                    max="50" 
                    step="5"
                />
                <span class="value">{brushSize}px</span>
                <button onclick={clearMask} class="clear-btn">Clear Mask</button>
            </div>
            
            <canvas 
                bind:this={canvasRef}
                width="200"
                height="150"
                class="mask-canvas"
                onmousedown={startDrawing}
                onmousemove={draw}
                onmouseup={stopDrawing}
                onmouseleave={stopDrawing}
                onmount={initCanvas}
            ></canvas>
        </div>

        <div class="status-display">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    🎨 Ready to Inpaint
                {:else if processingStatus === 'processing'}
                    🔄 Inpainting...
                {:else}
                    ✅ Inpainting Complete
                {/if}
            </div>
        </div>

        {#if inpaintedImage}
            <div class="result-preview">
                <h4>Result:</h4>
                <img src={inpaintedImage} alt="Inpainted result" />
            </div>
        {/if}
    </div>

    <!-- Output Socket -->
    <Handle 
        type="source"
        socketType="image"
        label="Inpainted Image"
        socket_id="inpaintedImage"
        tooltip="Result of inpainting operation"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Inpainted Image</span>
            <span class="socket-type">image</span>
        </div>
    </Handle>
</NodeWrapper>

<style>
    .inpaint-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .settings-section {
        display: grid;
        gap: 0.5rem;
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

    .setting select {
        flex: 1;
        padding: 0.25rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
    }

    .value {
        font-weight: 600;
        color: #4b5563;
        min-width: 2rem;
        text-align: right;
    }

    .mask-editor {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .mask-editor h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
    }

    .brush-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.75rem;
    }

    .brush-controls input[type="range"] {
        flex: 1;
        min-width: 60px;
    }

    .clear-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
    }

    .clear-btn:hover {
        background: #dc2626;
    }

    .mask-canvas {
        border: 2px solid #d1d5db;
        border-radius: 0.25rem;
        cursor: crosshair;
        width: 100%;
        height: auto;
        background: #ffffff;
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

    .result-preview {
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .result-preview h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
    }

    .result-preview img {
        width: 100%;
        max-height: 200px;
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