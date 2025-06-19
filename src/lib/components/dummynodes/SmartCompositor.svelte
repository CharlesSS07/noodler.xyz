<script module lang="ts">
    import { type Node } from '@xyflow/svelte';
    import type { JimpInstance } from 'jimp';

    export type SmartCompositorType = Node<
        {
            input: {
                foregroundImage?: JimpInstance;
                backgroundImage?: JimpInstance;
                compositionPrompt?: string;
            };
            output: {
                compositeResult?: JimpInstance;
                processingInfo?: Record<string, any>;
            };
        },
        'smart-compositor'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    
    let { id, data }: NodeProps<SmartCompositorType> = $props();

    // Node settings
    let lightingAdaptation = $state(0.8);
    let colorMatching = $state(0.7);
    let shadowGeneration = $state(0.6);
    let blendQuality = $state(0.9);

    // Output
    let compositeResult = $state('');
    let processingStatus = $state('ready');
    let compositionProgress = $state(0);

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_smart_compositor';
    });

    // Access input values
    let foregroundImage = $derived(data.input?.foregroundImage || '');
    let backgroundImage = $derived(data.input?.backgroundImage || '');
    let compositionPrompt = $derived(data.input?.compositionPrompt || '');

    // Process composition when inputs change
    $effect(() => {
        if (foregroundImage && backgroundImage) {
            composeImages();
        } else {
            processingStatus = 'ready';
            compositeResult = '';
            compositionProgress = 0;
        }
    });

    async function composeImages() {
        processingStatus = 'processing';
        compositionProgress = 0;

        // Simulate AI composition process
        const steps = [
            'Analyzing lighting conditions...',
            'Matching color temperature...',
            'Generating realistic shadows...',
            'Blending foreground and background...',
            'Applying final refinements...'
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            compositionProgress = ((i + 1) / steps.length) * 100;
        }

        compositeResult = createSmartComposite();
        processingStatus = 'complete';
        
        data.output.compositeResult = compositeResult;
        data.output.processingInfo = {
            lightingAdaptation,
            colorMatching,
            shadowGeneration,
            blendQuality,
            timestamp: new Date().toISOString()
        };
    }

    function createSmartComposite(): string {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;

        // Create realistic composite based on settings
        // Background layer
        const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGradient.addColorStop(0, '#667eea');
        bgGradient.addColorStop(0.5, '#764ba2');
        bgGradient.addColorStop(1, '#f093fb');
        
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply lighting adaptation
        ctx.globalAlpha = lightingAdaptation;
        ctx.globalCompositeOperation = 'multiply';
        
        // Foreground subject (simulated)
        const fgGradient = ctx.createRadialGradient(300, 200, 0, 300, 200, 120);
        fgGradient.addColorStop(0, '#ff6b6b');
        fgGradient.addColorStop(0.7, '#4ecdc4');
        fgGradient.addColorStop(1, 'transparent');
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = fgGradient;
        ctx.beginPath();
        ctx.ellipse(300, 200, 100, 140, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add shadows based on shadow generation setting
        if (shadowGeneration > 0.3) {
            ctx.globalAlpha = shadowGeneration * 0.5;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(320, 350, 80, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Color matching overlay
        ctx.globalAlpha = colorMatching * 0.3;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Final blend quality enhancement
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        
        // Add "AI Composed" watermark
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('AI Smart Composition', canvas.width / 2, canvas.height - 15);
        
        return canvas.toDataURL();
    }

    const nodeTitle = "Smart Compositor";
    const nodeDescription = "AI-powered intelligent composition with lighting and shadow matching";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="Smart Compositor">
    <!-- Input Sockets -->
    <Handle 
        type="target"
        socketType="image/jimp"
        label="Foreground"
        socket_id="foregroundImage"
        tooltip="Foreground subject to composite"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Foreground</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="image/jimp"
        label="Background"
        socket_id="backgroundImage"
        tooltip="Background image to composite onto"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Background</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Composition Prompt"
        socket_id="compositionPrompt"
        tooltip="Instructions for composition style"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Composition Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="compositor-content">
        <div class="settings-grid">
            <div class="setting">
                <label for="lighting">Lighting Adaptation:</label>
                <input 
                    type="range" 
                    id="lighting"
                    bind:value={lightingAdaptation} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{lightingAdaptation}</span>
            </div>

            <div class="setting">
                <label for="color">Color Matching:</label>
                <input 
                    type="range" 
                    id="color"
                    bind:value={colorMatching} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{colorMatching}</span>
            </div>

            <div class="setting">
                <label for="shadows">Shadow Generation:</label>
                <input 
                    type="range" 
                    id="shadows"
                    bind:value={shadowGeneration} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{shadowGeneration}</span>
            </div>

            <div class="setting">
                <label for="blend">Blend Quality:</label>
                <input 
                    type="range" 
                    id="blend"
                    bind:value={blendQuality} 
                    min="0" 
                    max="1" 
                    step="0.1"
                />
                <span class="value">{blendQuality}</span>
            </div>
        </div>

        <div class="composition-status">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    ✨ Ready to Compose
                {:else if processingStatus === 'processing'}
                    🎨 Composing Images...
                {:else}
                    ✅ Composition Complete
                {/if}
            </div>
            
            {#if processingStatus === 'processing'}
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {compositionProgress}%"></div>
                </div>
                <div class="progress-text">{Math.round(compositionProgress)}%</div>
            {/if}
        </div>

        {#if compositeResult}
            <div class="result-preview">
                <h4>Smart Composite Result:</h4>
                <img src={compositeResult} alt="AI composite result" />
                <div class="result-info">
                    <div class="info-item">Lighting: {lightingAdaptation}</div>
                    <div class="info-item">Color: {colorMatching}</div>
                    <div class="info-item">Shadows: {shadowGeneration}</div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Output Socket -->
    <Handle 
        type="source"
        socketType="image/jimp"
        label="Composite Result"
        socket_id="compositeResult"
        tooltip="Final composed image with AI enhancements"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Composite Result</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
</NodeWrapper>

<style>
    .compositor-content {
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

    .composition-status {
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
        background: linear-gradient(90deg, #10b981, #8b5cf6);
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