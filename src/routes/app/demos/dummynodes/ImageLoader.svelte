<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type ImageLoaderType = Node<
        {
            input: {
                imageUrl?: string;
            };
            output: {
                imageData?: string;
                imageDimensions?: { width: number; height: number };
                fileName?: string;
            };
        },
        'image-loader'
    >;
</script>

<script lang="ts">
    import { type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    import SocketStem from "$lib/components/SocketStem.svelte";
    
    let { id, data }: NodeProps<ImageLoaderType> = $props();

    let selectedFile: File | null = $state(null);
    let imageDataUrl = $state('');
    let imageDimensions = $state({ width: 0, height: 0 });
    let fileInput: HTMLInputElement;

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
    });

    // Access input values
    let imageUrl = $derived(data.input?.imageUrl || '');

    // Update output whenever image changes
    $effect(() => {
        data.output.imageData = imageDataUrl;
        data.output.imageDimensions = imageDimensions;
        data.output.fileName = selectedFile?.name || '';
    });

    // Handle file selection
    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file && file.type.startsWith('image/')) {
            selectedFile = file;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imageDataUrl = e.target?.result as string;
                
                // Get image dimensions
                const img = new Image();
                img.onload = () => {
                    imageDimensions = { width: img.width, height: img.height };
                };
                img.src = imageDataUrl;
            };
            reader.readAsDataURL(file);
        }
    }

    // Handle URL input
    $effect(() => {
        if (imageUrl && imageUrl.trim()) {
            // Create a proxy data URL for demo purposes
            imageDataUrl = imageUrl;
            imageDimensions = { width: 512, height: 512 }; // Default dimensions for URL images
            selectedFile = null;
        }
    });

    function clearImage() {
        selectedFile = null;
        imageDataUrl = '';
        imageDimensions = { width: 0, height: 0 };
        if (fileInput) fileInput.value = '';
    }

    const nodeTitle = "Image Loader";
    const nodeDescription = "Load images from file upload or URL for processing";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription}>
    <!-- Input Socket -->
    <SocketStem 
        type="target"
        socketType="string"
        label="Image URL"
        socket_id="imageUrl"
        tooltip="Load image from URL"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Image URL</span>
            <span class="socket-type">string</span>
        </div>
    </SocketStem>

    <!-- Node Content -->
    <div class="loader-content">
        <div class="upload-section">
            <input 
                type="file" 
                accept="image/*" 
                onchange={handleFileSelect}
                bind:this={fileInput}
                class="file-input"
            />
            <button onclick={() => fileInput?.click()} class="upload-button">
                Choose Image File
            </button>
        </div>

        {#if imageDataUrl}
            <div class="image-preview">
                <img src={imageDataUrl} alt="Loaded image" />
                <div class="image-info">
                    {#if selectedFile}
                        <div class="file-name">{selectedFile.name}</div>
                    {/if}
                    <div class="dimensions">
                        {imageDimensions.width} × {imageDimensions.height}
                    </div>
                </div>
                <button onclick={clearImage} class="clear-button">
                    Clear
                </button>
            </div>
        {:else}
            <div class="empty-state">
                <div class="empty-icon">🖼️</div>
                <div class="empty-text">No image loaded</div>
            </div>
        {/if}
    </div>

    <!-- Output Sockets -->
    <SocketStem 
        type="source"
        socketType="image"
        label="Image Data"
        socket_id="imageData"
        tooltip="Loaded image data"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Image Data</span>
            <span class="socket-type">image</span>
        </div>
    </SocketStem>
    
    <SocketStem 
        type="source"
        socketType="object"
        label="Dimensions"
        socket_id="imageDimensions"
        tooltip="Image width and height"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Dimensions</span>
            <span class="socket-type">object</span>
        </div>
    </SocketStem>
</NodeWrapper>

<style>
    .loader-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .upload-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .file-input {
        display: none;
    }

    .upload-button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.75rem 1rem;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.2s;
    }

    .upload-button:hover {
        background: #2563eb;
    }

    .image-preview {
        position: relative;
        border: 2px dashed #d1d5db;
        border-radius: 0.5rem;
        padding: 0.5rem;
        background: #f9fafb;
    }

    .image-preview img {
        width: 100%;
        max-height: 150px;
        object-fit: contain;
        border-radius: 0.25rem;
    }

    .image-info {
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: #6b7280;
    }

    .file-name {
        font-weight: 500;
        color: #374151;
        word-break: break-all;
    }

    .dimensions {
        color: #9ca3af;
    }

    .clear-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .clear-button:hover {
        background: #dc2626;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem 1rem;
        border: 2px dashed #d1d5db;
        border-radius: 0.5rem;
        color: #9ca3af;
    }

    .empty-icon {
        font-size: 2rem;
    }

    .empty-text {
        font-size: 0.875rem;
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