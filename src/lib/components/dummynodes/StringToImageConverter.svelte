<script module lang="ts">
    import { type Node } from '@xyflow/svelte';
    import type { JimpInstance } from 'jimp';

    export type StringToImageConverterType = Node<
        {
            input: {
                imageString?: string;
            };
            output: {
                jimpImage?: JimpInstance;
                imageDimensions?: { width: number; height: number };
            };
        },
        'string-to-image-converter'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";

    let { id, data }: NodeProps<StringToImageConverterType> = $props();

    // Node state
    let jimpImage = $state<JimpInstance | null>(null);
    let previewDataUrl = $state('');
    let imageDimensions = $state({ width: 0, height: 0 });
    let processingStatus = $state('ready');
    let errorMessage = $state('');

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_string_to_image_converter';
    });

    // Access input values
    let imageString = $derived(data.input?.imageString || '');

    // Convert string to Jimp image when input changes
    $effect(() => {
        if (imageString && imageString.trim()) {
            convertStringToJimp(imageString.trim());
        } else {
            processingStatus = 'ready';
            jimpImage = null;
            previewDataUrl = '';
            imageDimensions = { width: 0, height: 0 };
            errorMessage = '';
        }
    });

    // Update output whenever image changes
    $effect(() => {
        data.output.jimpImage = jimpImage;
        data.output.imageDimensions = imageDimensions;
    });

    async function convertStringToJimp(str: string) {
        processingStatus = 'processing';
        errorMessage = '';
        
        try {
            let imageData: JimpInstance;
            
            if (isBase64Image(str)) {
                // Handle base64 string
                const buffer = Buffer.from(str.split(',')[1], 'base64');
                imageData = await Jimp.read(buffer);
            } else if (isValidUrl(str)) {
                // Handle URL - create mock image for demo
                imageData = await createMockJimpFromUrl(str);
            } else {
                // Handle as potential image data or create mock
                imageData = await createMockJimpFromString(str);
            }
            
            jimpImage = imageData;
            previewDataUrl = await imageData.getBase64Async(Jimp.MIME_PNG);
            imageDimensions = { width: imageData.getWidth(), height: imageData.getHeight() };
            processingStatus = 'complete';
        } catch (error) {
            processingStatus = 'error';
            errorMessage = 'Failed to convert string to image';
            jimpImage = null;
            previewDataUrl = '';
            imageDimensions = { width: 0, height: 0 };
        }
    }

    function isBase64Image(str: string): boolean {
        return str.startsWith('data:image/') && str.includes('base64,');
    }

    function isValidUrl(str: string): boolean {
        try {
            new URL(str);
            return true;
        } catch (_) {
            return false;
        }
    }

    async function createMockJimpFromUrl(url: string): Promise<JimpInstance> {
        // Create a mock Jimp image based on URL hash
        const hash = simpleHash(url);
        const width = 400;
        const height = 300;
        
        const image = new Jimp(width, height, 0x000000ff);
        
        // Create gradient effect based on URL
        const hue = hash % 360;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const progress = (x + y) / (width + height);
                const color = Jimp.rgbaToInt(
                    Math.floor(255 * Math.sin((progress + hue / 360) * Math.PI)),
                    Math.floor(255 * Math.sin((progress + (hue + 120) / 360) * Math.PI)),
                    Math.floor(255 * Math.sin((progress + (hue + 240) / 360) * Math.PI)),
                    255
                );
                image.setPixelColor(color, x, y);
            }
        }
        
        return image;
    }

    async function createMockJimpFromString(str: string): Promise<JimpInstance> {
        // Create a mock Jimp image based on string content
        const hash = simpleHash(str);
        const width = 400;
        const height = 300;
        
        const image = new Jimp(width, height, 0x000000ff);
        
        // Fill with pattern based on string
        const colors = [
            0xff6b6bff, 0x4ecdc4ff, 0x45b7d1ff, 0x96ceb4ff, 
            0xfeca57ff, 0xff9ff3ff, 0x667eeaff, 0x764ba2ff
        ];
        
        for (let i = 0; i < 50; i++) {
            const x = (hash * i) % width;
            const y = (hash * (i + 1)) % height;
            const radius = 20 + (hash % 30);
            const color = colors[i % colors.length];
            
            // Draw circle
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (dx * dx + dy * dy <= radius * radius) {
                        const px = x + dx;
                        const py = y + dy;
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            image.setPixelColor(color, px, py);
                        }
                    }
                }
            }
        }
        
        return image;
    }

    function simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    const nodeTitle = "String to Image Converter";
    const nodeDescription = "Converts strings, URLs, or base64 data to Jimp image format";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="String to Image">
    <!-- Input Socket -->
    <Handle 
        type="target"
        socketType="string"
        label="Image String"
        socket_id="imageString"
        tooltip="URL, base64, or string data to convert to image"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Image String</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="converter-content">
        <div class="status-display">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    🔄 Ready to Convert
                {:else if processingStatus === 'processing'}
                    ⚙️ Converting to Jimp...
                {:else if processingStatus === 'complete'}
                    ✅ Conversion Complete
                {:else}
                    ❌ Conversion Error
                {/if}
            </div>
            
            {#if errorMessage}
                <div class="error-message">{errorMessage}</div>
            {/if}
        </div>

        {#if imageString && processingStatus === 'ready'}
            <div class="input-preview">
                <h4>Input String:</h4>
                <div class="string-text">
                    {imageString.length > 100 ? imageString.substring(0, 100) + '...' : imageString}
                </div>
            </div>
        {/if}

        {#if previewDataUrl}
            <div class="image-preview">
                <h4>Jimp Image Result:</h4>
                <img src={previewDataUrl} alt="Converted Jimp image" />
                <div class="image-info">
                    <div class="dimensions">
                        {imageDimensions.width} × {imageDimensions.height}
                    </div>
                    <div class="format">Jimp Format</div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Output Sockets -->
    <Handle 
        type="source"
        socketType="image/jimp"
        label="Jimp Image"
        socket_id="jimpImage"
        tooltip="Converted Jimp image instance"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Jimp Image</span>
            <span class="socket-type">image/jimp</span>
        </div>
    </Handle>
    
    <Handle 
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
    </Handle>
</NodeWrapper>

<style>
    .converter-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

    .status-indicator.error {
        background: #fee2e2;
        color: #dc2626;
    }

    .error-message {
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: #dc2626;
        font-weight: 500;
    }

    .input-preview {
        border: 2px dashed #d1d5db;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .input-preview h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
    }

    .string-text {
        font-size: 0.75rem;
        color: #6b7280;
        word-break: break-all;
        background: #ffffff;
        padding: 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid #e5e7eb;
        font-family: monospace;
    }

    .image-preview {
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .image-preview h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
    }

    .image-preview img {
        width: 100%;
        max-height: 150px;
        object-fit: contain;
        border-radius: 0.25rem;
        border: 1px solid #e5e7eb;
    }

    .image-info {
        margin-top: 0.5rem;
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #6b7280;
    }

    .dimensions, .format {
        background: #ffffff;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid #e5e7eb;
        font-weight: 500;
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