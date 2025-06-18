<script lang="ts">
    import type { JIMPSocketParams } from '$lib/compositor/SocketParamBuilders';
    
    export let value: File | string | null = null;
    export let params: JIMPSocketParams | undefined = undefined;
    export let disabled: boolean = false;
    export let socketId: string = '';
    
    let fileInput: HTMLInputElement;
    let imagePreview: string = '';
    
    // Extract parameters with defaults
    $: displayImage = params?.displayImage ?? true;
    
    // Handle file selection
    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (files && files.length > 0) {
            const file = files[0];
            value = file;
            
            // Create preview if it's an image file
            if (displayImage && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview = e.target?.result as string;
                };
                reader.readAsDataURL(file);
            }
        }
    }
    
    function clearImage() {
        value = null;
        imagePreview = '';
        if (fileInput) {
            fileInput.value = '';
        }
    }
    
    function triggerFileSelect() {
        if (!disabled && fileInput) {
            fileInput.click();
        }
    }
    
    // Handle base64 string values
    $: {
        if (typeof value === 'string' && value.startsWith('data:image/')) {
            imagePreview = value;
        } else if (typeof value === 'string' && value === 'empty_jimp_image') {
            imagePreview = '';
        }
    }
</script>

<div class="image-input">
    <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        onchange={handleFileSelect}
        class="hidden-file-input"
        {disabled}
        title="Socket: {socketId}"
    />
    
    <div class="image-selector" class:disabled>
        {#if value && imagePreview && displayImage}
            <div class="image-preview">
                <img src={imagePreview} alt="Preview" class="preview-image" />
                {#if !disabled}
                    <button 
                        class="clear-button"
                        onclick={clearImage}
                        type="button"
                    >
                        ×
                    </button>
                {/if}
                <div class="image-info">
                    {#if value instanceof File}
                        <span class="file-name">{value.name}</span>
                        <span class="file-size">{Math.round(value.size / 1024)}KB</span>
                    {:else}
                        <span class="file-name">Base64 Image</span>
                    {/if}
                </div>
            </div>
        {:else if value}
            <div class="file-info">
                <div class="file-details">
                    {#if value instanceof File}
                        <div class="file-name">{value.name}</div>
                        <div class="file-meta">
                            {Math.round(value.size / 1024)}KB • {value.type}
                        </div>
                    {:else}
                        <div class="file-name">Image Data</div>
                        <div class="file-meta">Base64 or JIMP object</div>
                    {/if}
                </div>
                {#if !disabled}
                    <button 
                        class="clear-button"
                        onclick={clearImage}
                        type="button"
                    >
                        ×
                    </button>
                {/if}
            </div>
        {:else}
            <button 
                class="select-button"
                onclick={triggerFileSelect}
                {disabled}
                type="button"
            >
                {disabled ? 'Image input disabled' : 'Select image...'}
            </button>
        {/if}
    </div>
    
    <div class="input-hints">
        <span class="hint">Accepts: PNG, JPG, GIF, WebP</span>
        {#if !displayImage}
            <span class="hint">Preview disabled</span>
        {/if}
    </div>
</div>

<style>
    .image-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .hidden-file-input {
        display: none;
    }
    
    .image-selector {
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        background: white;
        overflow: hidden;
    }
    
    .image-selector.disabled {
        background: #f9fafb;
        color: #6b7280;
    }
    
    .image-preview {
        position: relative;
        padding: 0.5rem;
    }
    
    .preview-image {
        width: 100%;
        max-height: 8rem;
        object-fit: contain;
        border-radius: 0.25rem;
        background: #f3f4f6;
    }
    
    .image-info {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .file-info {
        padding: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .file-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .file-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
        word-break: break-all;
    }
    
    .file-size,
    .file-meta {
        font-size: 0.625rem;
        color: #6b7280;
    }
    
    .clear-button {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        width: 1.5rem;
        height: 1.5rem;
        border: none;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        line-height: 1;
        backdrop-filter: blur(4px);
    }
    
    .file-info .clear-button {
        position: static;
        margin-left: 0.5rem;
    }
    
    .clear-button:hover {
        background: rgba(220, 38, 38, 0.9);
    }
    
    .select-button {
        width: 100%;
        padding: 2rem 1rem;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 0.75rem;
        cursor: pointer;
        text-align: center;
        border: 2px dashed #d1d5db;
        margin: 0.5rem;
        border-radius: 0.25rem;
    }
    
    .select-button:hover:not(:disabled) {
        background: #f3f4f6;
        color: #374151;
        border-color: #9ca3af;
    }
    
    .select-button:disabled {
        cursor: not-allowed;
    }
    
    .input-hints {
        display: flex;
        gap: 0.5rem;
    }
    
    .hint {
        font-size: 0.625rem;
        color: #6b7280;
        font-style: italic;
    }
</style>