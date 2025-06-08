<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type StyleTransferType = Node<
        {
            input: {
                sourceImage?: string;
                styleReference?: string;
                prompt?: string;
            };
            output: {
                processedImage?: string;
                processingInfo?: Record<string, any>;
            };
        },
        'style-transfer'
    >;
</script>

<script lang="ts">
    import { type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    import SocketStem from "$lib/components/SocketStem.svelte";
    
    let { id, data }: NodeProps<StyleTransferType> = $props();

    // Node settings
    let strength = $state(0.7);
    let preserveColors = $state(false);
    let styleIntensity = $state(0.8);
    let blendMode = $state('multiply');

    // Output
    let processedImage = $state('');
    let processingStatus = $state('ready');

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
    });

    // Access input values
    let sourceImage = $derived(data.input?.sourceImage || '');
    let styleReference = $derived(data.input?.styleReference || '');
    let prompt = $derived(data.input?.prompt || '');

    // Simulate style transfer processing
    $effect(() => {
        if (sourceImage && (styleReference || prompt)) {
            processingStatus = 'processing';
            
            // Simulate processing delay
            setTimeout(() => {
                // Create a mock processed image (in reality this would call an AI service)
                processedImage = generateMockResult();
                processingStatus = 'complete';
                data.output.processedImage = processedImage;
                data.output.processingInfo = {
                    strength,
                    preserveColors,
                    styleIntensity,
                    blendMode,
                    timestamp: new Date().toISOString()
                };
            }, 2000);
        } else {
            processingStatus = 'ready';
            processedImage = '';
        }
    });

    function generateMockResult(): string {
        // Generate a mock result based on settings - in reality this would be the AI-processed image
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d')!;
        
        // Create a gradient that represents the "styled" image
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (blendMode === 'multiply') {
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.5, '#4ecdc4');
            gradient.addColorStop(1, '#45b7d1');
        } else if (blendMode === 'overlay') {
            gradient.addColorStop(0, '#96ceb4');
            gradient.addColorStop(0.5, '#feca57');
            gradient.addColorStop(1, '#ff9ff3');
        } else {
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#f093fb');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some "artistic" elements
        ctx.globalAlpha = strength;
        ctx.fillStyle = preserveColors ? '#ffffff20' : '#00000020';
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 50 + 10,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        return canvas.toDataURL();
    }

    const nodeTitle = "Style Transfer";
    const nodeDescription = "Apply artistic style transfer to images using AI diffusion models";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription}>
    <!-- Input Sockets -->
    <SocketStem 
        type="target"
        socketType="image"
        label="Source Image"
        socket_id="sourceImage"
        tooltip="Original image to transform"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Source Image</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="target"
        socketType="image"
        label="Style Reference"
        socket_id="styleReference"
        tooltip="Reference image for style"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Style Reference</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="target"
        socketType="string"
        label="Style Prompt"
        socket_id="prompt"
        tooltip="Text description of desired style"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Style Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </SocketStem>

    <!-- Node Content -->
    <div class="transfer-content">
        <div class="settings-grid">
            <div class="setting">
                <label for="strength">Transfer Strength:</label>
                <input 
                    type="range" 
                    id="strength"
                    bind:value={strength} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{strength}</span>
            </div>

            <div class="setting">
                <label for="styleIntensity">Style Intensity:</label>
                <input 
                    type="range" 
                    id="styleIntensity"
                    bind:value={styleIntensity} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{styleIntensity}</span>
            </div>

            <div class="setting">
                <label for="blendMode">Blend Mode:</label>
                <select bind:value={blendMode} id="blendMode">
                    <option value="multiply">Multiply</option>
                    <option value="overlay">Overlay</option>
                    <option value="screen">Screen</option>
                    <option value="softlight">Soft Light</option>
                </select>
            </div>

            <div class="setting checkbox">
                <label>
                    <input type="checkbox" bind:checked={preserveColors} />
                    Preserve Original Colors
                </label>
            </div>
        </div>

        <div class="status-display">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    ⚡ Ready
                {:else if processingStatus === 'processing'}
                    🔄 Processing...
                {:else}
                    ✅ Complete
                {/if}
            </div>
        </div>

        {#if processedImage}
            <div class="result-preview">
                <img src={processedImage} alt="Style transferred result" />
            </div>
        {/if}
    </div>

    <!-- Output Socket -->
    <SocketStem 
        type="source"
        socketType="image"
        label="Processed Image"
        socket_id="processedImage"
        tooltip="Style-transferred result"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Processed Image</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>
</NodeWrapper>

<style>
    .transfer-content {
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

    .setting.checkbox {
        justify-content: flex-start;
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

    .setting input[type="checkbox"] {
        margin-right: 0.25rem;
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

    .result-preview {
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.5rem;
        background: #f9fafb;
    }

    .result-preview img {
        width: 100%;
        max-height: 200px;
        object-fit: contain;
        border-radius: 0.25rem;
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