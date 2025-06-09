<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type CompositeGeneratorType = Node<
        {
            input: {
                mainPrompt?: string;
                backgroundImage?: string;
                overlayImage?: string;
                maskImage?: string;
            };
            output: {
                compositeImage?: string;
                processingInfo?: Record<string, any>;
            };
        },
        'composite-generator'
    >;
</script>

<script lang="ts">
    import { type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    import SocketStem from "$lib/components/SocketStem.svelte";
    
    let { id, data }: NodeProps<CompositeGeneratorType> = $props();

    // Node settings
    let compositeMode = $state('overlay');
    let opacity = $state(0.8);
    let blendStrength = $state(0.7);
    let colorBalance = $state(0.5);
    let contrast = $state(1.0);
    let saturation = $state(1.0);

    // Output
    let compositeResult = $state('');
    let processingStatus = $state('ready');
    let generationProgress = $state(0);

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_composite_generator';
    });

    // Access input values
    let mainPrompt = $derived(data.input.mainPrompt || '');
    let backgroundImage = $derived(data.input.backgroundImage || '');
    let overlayImage = $derived(data.input.overlayImage || '');
    let maskImage = $derived(data.input.maskImage || '');

    // Process composite when inputs change
    $effect(() => {
        if (mainPrompt && (backgroundImage || overlayImage)) {
            generateComposite();
        } else {
            processingStatus = 'ready';
            compositeResult = '';
            generationProgress = 0;
        }
    });

    async function generateComposite() {
        processingStatus = 'processing';
        generationProgress = 0;

        // Simulate progressive generation
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            generationProgress = (i / steps) * 100;
        }

        compositeResult = createMockComposite();
        processingStatus = 'complete';
        
        data.output.compositeImage = compositeResult;
        data.output.processingInfo = {
            compositeMode,
            opacity,
            blendStrength,
            colorBalance,
            contrast,
            saturation,
            timestamp: new Date().toISOString()
        };
    }

    function createMockComposite(): string {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;

        // Create composite based on mode and settings
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        
        if (compositeMode === 'overlay') {
            gradient.addColorStop(0, `rgba(255, 107, 107, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(78, 205, 196, ${opacity})`);
            gradient.addColorStop(1, `rgba(69, 183, 209, ${opacity})`);
        } else if (compositeMode === 'multiply') {
            gradient.addColorStop(0, `rgba(150, 206, 180, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(254, 202, 87, ${opacity})`);
            gradient.addColorStop(1, `rgba(255, 159, 243, ${opacity})`);
        } else {
            gradient.addColorStop(0, `rgba(102, 126, 234, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(118, 75, 162, ${opacity})`);
            gradient.addColorStop(1, `rgba(240, 147, 251, ${opacity})`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply color adjustments
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = contrast;
        
        // Add texture based on settings
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${blendStrength * 0.3})`;
            ctx.fillRect(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 100 + 20,
                Math.random() * 100 + 20
            );
        }

        // Add "generated" text overlay
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.font = '24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText('AI Generated Composite', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '14px Arial';
        ctx.fillText(`Mode: ${compositeMode} | Blend: ${blendStrength}`, canvas.width / 2, canvas.height / 2 + 30);

        return canvas.toDataURL();
    }

    const nodeTitle = "Composite Generator";
    const nodeDescription = "Generate complex composite images by blending multiple inputs with AI";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="Composite Generator">
    <!-- Input Sockets -->
    <SocketStem 
        type="target"
        socketType="string"
        label="Main Prompt"
        socket_id="mainPrompt"
        tooltip="Primary generation prompt"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Main Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="target"
        socketType="image"
        label="Background"
        socket_id="backgroundImage"
        tooltip="Base background image"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Background</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="target"
        socketType="image"
        label="Overlay"
        socket_id="overlayImage"
        tooltip="Overlay image to blend"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Overlay</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="target"
        socketType="image"
        label="Mask"
        socket_id="maskImage"
        tooltip="Blend mask (optional)"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Mask</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>

    <!-- Node Content -->
    <div class="generator-content">
        <div class="settings-grid">
            <div class="setting">
                <label for="mode">Composite Mode:</label>
                <select bind:value={compositeMode} id="mode">
                    <option value="overlay">Overlay</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="softlight">Soft Light</option>
                    <option value="hardlight">Hard Light</option>
                    <option value="difference">Difference</option>
                </select>
            </div>

            <div class="setting">
                <label for="opacity">Opacity:</label>
                <input 
                    type="range" 
                    id="opacity"
                    bind:value={opacity} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{opacity}</span>
            </div>

            <div class="setting">
                <label for="blend">Blend Strength:</label>
                <input 
                    type="range" 
                    id="blend"
                    bind:value={blendStrength} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{blendStrength}</span>
            </div>

            <div class="setting">
                <label for="balance">Color Balance:</label>
                <input 
                    type="range" 
                    id="balance"
                    bind:value={colorBalance} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{colorBalance}</span>
            </div>

            <div class="setting">
                <label for="contrast">Contrast:</label>
                <input 
                    type="range" 
                    id="contrast"
                    bind:value={contrast} 
                    min="0.5" 
                    max="2" 
                    step="0.1"
                />
                <span class="value">{contrast}</span>
            </div>

            <div class="setting">
                <label for="saturation">Saturation:</label>
                <input 
                    type="range" 
                    id="saturation"
                    bind:value={saturation} 
                    min="0" 
                    max="2" 
                    step="0.1"
                />
                <span class="value">{saturation}</span>
            </div>
        </div>

        <div class="generation-status">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    🎨 Ready to Generate
                {:else if processingStatus === 'processing'}
                    🔄 Generating Composite...
                {:else}
                    ✅ Generation Complete
                {/if}
            </div>
            
            {#if processingStatus === 'processing'}
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {generationProgress}%"></div>
                </div>
                <div class="progress-text">{Math.round(generationProgress)}%</div>
            {/if}
        </div>

        {#if compositeResult}
            <div class="result-preview">
                <h4>Generated Composite:</h4>
                <img src={compositeResult} alt="Generated composite" />
                <div class="result-info">
                    <div class="info-item">Mode: {compositeMode}</div>
                    <div class="info-item">Opacity: {opacity}</div>
                    <div class="info-item">Blend: {blendStrength}</div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Output Socket -->
    <SocketStem 
        type="source"
        socketType="image"
        label="Composite Image"
        socket_id="compositeImage"
        tooltip="Generated composite result"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Composite Image</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>
</NodeWrapper>

<style>
    .generator-content {
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

    .generation-status {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        transition: width 0.3s ease;
        border-radius: 4px;
    }

    .progress-text {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
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

    .result-info {
        margin-top: 0.5rem;
        display: flex;
        justify-content: space-between;
        font-size: 0.625rem;
        color: #6b7280;
    }

    .info-item {
        background: #ffffff;
        padding: 0.25rem 0.5rem;
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