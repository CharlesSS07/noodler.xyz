<script module lang="ts">
    import { type Node } from '@xyflow/svelte';
    import type { JimpInstance } from 'jimp';

    export type BackgroundGeneratorType = Node<
        {
            input: {
                backgroundPrompt?: string;
                backgroundMask?: JimpInstance;
                styleReference?: JimpInstance;
            };
            output: {
                generatedBackground?: JimpInstance;
                processingInfo?: Record<string, any>;
            };
        },
        'background-generator'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";

    let { id, data }: NodeProps<BackgroundGeneratorType> = $props();

    // Node settings
    let creativityLevel = $state(0.7);
    let detailLevel = $state(0.8);
    let colorHarmony = $state(0.6);
    let generationSteps = $state(30);

    // Output
    let generatedResult = $state('');
    let processingStatus = $state('ready');
    let generationProgress = $state(0);

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_background_generator';
    });

    // Access input values
    let backgroundPrompt = $derived(data.input?.backgroundPrompt || '');
    let backgroundMask = $derived(data.input?.backgroundMask || '');
    let styleReference = $derived(data.input?.styleReference || '');

    // Generate background when inputs change
    $effect(() => {
        if (backgroundPrompt && backgroundMask) {
            generateBackground();
        } else {
            processingStatus = 'ready';
            generatedResult = '';
            generationProgress = 0;
        }
    });

    async function generateBackground() {
        processingStatus = 'processing';
        generationProgress = 0;

        // Simulate progressive generation
        const steps = generationSteps;
        for (let i = 1; i <= steps; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            generationProgress = (i / steps) * 100;
        }

        generatedResult = createMockBackground();
        processingStatus = 'complete';
        
        data.output.generatedBackground = generatedResult;
        data.output.processingInfo = {
            creativityLevel,
            detailLevel,
            colorHarmony,
            generationSteps,
            timestamp: new Date().toISOString()
        };
    }

    function createMockBackground(): string {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;

        // Create realistic background based on settings
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        
        if (backgroundPrompt.includes('sunset') || backgroundPrompt.includes('golden')) {
            gradient.addColorStop(0, '#ff9a9e');
            gradient.addColorStop(0.5, '#fad0c4');
            gradient.addColorStop(1, '#a8edea');
        } else if (backgroundPrompt.includes('forest') || backgroundPrompt.includes('nature')) {
            gradient.addColorStop(0, '#134e5e');
            gradient.addColorStop(0.5, '#71b280');
            gradient.addColorStop(1, '#85d8ce');
        } else if (backgroundPrompt.includes('city') || backgroundPrompt.includes('urban')) {
            gradient.addColorStop(0, '#4b6cb7');
            gradient.addColorStop(0.5, '#182848');
            gradient.addColorStop(1, '#667eea');
        } else {
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#f093fb');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add detail based on detail level
        ctx.globalAlpha = detailLevel;
        for (let i = 0; i < Math.floor(detailLevel * 15); i++) {
            ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${colorHarmony * 0.3})`;
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 40 + 5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Add "AI Generated" watermark
        ctx.globalAlpha = 1;
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('AI Generated Background', canvas.width / 2, canvas.height - 20);
        
        return canvas.toDataURL();
    }

    const nodeTitle = "Background Generator";
    const nodeDescription = "Generate new backgrounds using AI diffusion models";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="Background Generator">
    <!-- Input Sockets -->
    <Handle 
        type="target"
        socketType="string"
        label="Background Prompt"
        socket_id="backgroundPrompt"
        tooltip="Description of desired background"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Background Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="image/jimp"
        label="Background Mask"
        socket_id="backgroundMask"
        tooltip="Mask defining background area"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Background Mask</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="image/jimp"
        label="Style Reference"
        socket_id="styleReference"
        tooltip="Optional style reference image"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Style Reference</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="generator-content">
        <div class="settings-grid">
            <div class="setting">
                <label for="creativity">Creativity Level:</label>
                <input 
                    type="range" 
                    id="creativity"
                    bind:value={creativityLevel} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{creativityLevel}</span>
            </div>

            <div class="setting">
                <label for="detail">Detail Level:</label>
                <input 
                    type="range" 
                    id="detail"
                    bind:value={detailLevel} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{detailLevel}</span>
            </div>

            <div class="setting">
                <label for="harmony">Color Harmony:</label>
                <input 
                    type="range" 
                    id="harmony"
                    bind:value={colorHarmony} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{colorHarmony}</span>
            </div>

            <div class="setting">
                <label for="steps">Generation Steps:</label>
                <input 
                    type="range" 
                    id="steps"
                    bind:value={generationSteps} 
                    min="10" 
                    max="100" 
                    step="5"
                />
                <span class="value">{generationSteps}</span>
            </div>
        </div>

        <div class="generation-status">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    🎨 Ready to Generate
                {:else if processingStatus === 'processing'}
                    🔄 Generating Background...
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

        {#if generatedResult}
            <div class="result-preview">
                <h4>Generated Background:</h4>
                <img src={generatedResult} alt="Generated background" />
                <div class="result-info">
                    <div class="info-item">Creativity: {creativityLevel}</div>
                    <div class="info-item">Detail: {detailLevel}</div>
                    <div class="info-item">Steps: {generationSteps}</div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Output Socket -->
    <Handle 
        type="source"
        socketType="image/jimp"
        label="Generated Background"
        socket_id="generatedBackground"
        tooltip="AI-generated background image"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Generated Background</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
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