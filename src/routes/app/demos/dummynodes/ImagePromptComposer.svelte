<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type ImagePromptComposerType = Node<
        {
            input: {
                basePrompt?: string;
                styleModifiers?: string;
                qualitySettings?: string;
            };
            output: {
                composedPrompt?: string;
            };
        },
        'image-prompt-composer'
    >;
</script>

<script lang="ts">
    import { type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    import SocketStem from "$lib/components/SocketStem.svelte";
    
    let { id, data }: NodeProps<ImagePromptComposerType> = $props();

    let composedPrompt = $state('');
    let style = $state('photorealistic');
    let quality = $state('high');
    let aspectRatio = $state('16:9');

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
    });

    // Access input values
    let basePrompt = $derived(data.input?.basePrompt || '');
    let styleModifiers = $derived(data.input?.styleModifiers || '');
    let qualitySettings = $derived(data.input?.qualitySettings || '');

    // Compose the prompt whenever inputs change
    $effect(() => {
        let prompt = basePrompt || 'A stunning digital artwork';
        
        if (styleModifiers) {
            prompt += `, ${styleModifiers}`;
        }
        
        prompt += `, ${style} style`;
        
        if (qualitySettings) {
            prompt += `, ${qualitySettings}`;
        } else {
            prompt += `, ${quality} quality, ${aspectRatio} aspect ratio`;
        }
        
        prompt += ', highly detailed, professional lighting, vivid colors';
        
        composedPrompt = prompt;
        data.output.composedPrompt = composedPrompt;
    });

    const nodeTitle = "Image Prompt Composer";
    const nodeDescription = "Combines multiple prompt elements into a sophisticated image generation prompt";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription}>
    <!-- Input Sockets -->
    <SocketStem 
        type="target"
        socketType="string"
        label="Base Prompt"
        socket_id="basePrompt"
        tooltip="Core image description"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Base Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="target"
        socketType="string"
        label="Style Modifiers"
        socket_id="styleModifiers"
        tooltip="Additional style keywords"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Style Modifiers</span>
            <span class="socket-type">string</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="target"
        socketType="string"
        label="Quality Settings"
        socket_id="qualitySettings"
        tooltip="Quality and technical parameters"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Quality Settings</span>
            <span class="socket-type">string</span>
        </div>
    </SocketStem>

    <!-- Node Content -->
    <div class="composer-content">
        <div class="input-group">
            <label for="style">Style:</label>
            <select bind:value={style} id="style">
                <option value="photorealistic">Photorealistic</option>
                <option value="artistic">Artistic</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="fantasy">Fantasy</option>
                <option value="minimalist">Minimalist</option>
                <option value="vintage">Vintage</option>
                <option value="anime">Anime</option>
            </select>
        </div>

        <div class="input-group">
            <label for="quality">Quality:</label>
            <select bind:value={quality} id="quality">
                <option value="high">High</option>
                <option value="ultra">Ultra</option>
                <option value="8k">8K Resolution</option>
                <option value="masterpiece">Masterpiece</option>
            </select>
        </div>

        <div class="input-group">
            <label for="aspect">Aspect Ratio:</label>
            <select bind:value={aspectRatio} id="aspect">
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Widescreen (16:9)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="3:2">Portrait (3:2)</option>
                <option value="21:9">Ultrawide (21:9)</option>
            </select>
        </div>

        <div class="preview">
            <h4>Composed Prompt:</h4>
            <div class="prompt-preview">{composedPrompt}</div>
        </div>
    </div>

    <!-- Output Socket -->
    <SocketStem 
        type="source"
        socketType="string"
        label="Composed Prompt"
        socket_id="composedPrompt"
        tooltip="Ready-to-use image generation prompt"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Composed Prompt</span>
            <span class="socket-type">string</span>
        </div>
    </SocketStem>
</NodeWrapper>

<style>
    .composer-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .input-group label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
    }

    .input-group select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        background: white;
    }

    .input-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }

    .preview {
        margin-top: 0.5rem;
    }

    .preview h4 {
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }

    .prompt-preview {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.25rem;
        padding: 0.75rem;
        font-size: 0.75rem;
        line-height: 1.4;
        color: #4b5563;
        max-height: 4rem;
        overflow-y: auto;
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
</style>