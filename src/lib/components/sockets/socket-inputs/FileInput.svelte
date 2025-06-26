<script lang="ts">
    export let value: File | null = null;
    export let disabled: boolean = false;
    export let socketId: string = '';
    export let acceptedTypes: string = '*'; // File type filter
    
    let fileInput: HTMLInputElement;
    
    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (files && files.length > 0) {
            value = files[0];
        }
    }
    
    function clearFile() {
        value = null;
        if (fileInput) {
            fileInput.value = '';
        }
    }
    
    function triggerFileSelect() {
        if (!disabled && fileInput) {
            fileInput.click();
        }
    }
    
    // Determine accepted file types based on socket type
    $: {
        if (socketId.includes('csv')) {
            acceptedTypes = '.csv';
        } else if (socketId.includes('tsv')) {
            acceptedTypes = '.tsv';
        } else if (socketId.includes('image')) {
            acceptedTypes = 'image/*';
        }
    }
</script>

<div class="file-input">
    <input
        bind:this={fileInput}
        type="file"
        accept={acceptedTypes}
        on:change={handleFileSelect}
        class="hidden-file-input"
        {disabled}
        title="Socket: {socketId}"
    />
    
    <div class="file-selector" class:disabled>
        {#if value}
            <div class="file-info">
                <div class="file-name">{value.name}</div>
                <div class="file-details">
                    {Math.round(value.size / 1024)}KB • {value.type || 'Unknown type'}
                </div>
                {#if !disabled}
                    <button 
                        class="clear-button"
                        on:click={clearFile}
                        type="button"
                    >
                        ×
                    </button>
                {/if}
            </div>
        {:else}
            <button 
                class="select-button"
                on:click={triggerFileSelect}
                {disabled}
                type="button"
            >
                {disabled ? 'File input disabled' : 'Select file...'}
            </button>
        {/if}
    </div>
    
    {#if acceptedTypes !== '*'}
        <div class="input-hints">
            <span class="hint">Accepts: {acceptedTypes}</span>
        </div>
    {/if}
</div>

<style>
    .file-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .hidden-file-input {
        display: none;
    }
    
    .file-selector {
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        background: white;
        overflow: hidden;
    }
    
    .file-selector.disabled {
        background: #f9fafb;
        color: #6b7280;
    }
    
    .file-info {
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: relative;
    }
    
    .file-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
        word-break: break-all;
    }
    
    .file-details {
        font-size: 0.625rem;
        color: #6b7280;
    }
    
    .clear-button {
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        width: 1.5rem;
        height: 1.5rem;
        border: none;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        line-height: 1;
    }
    
    .clear-button:hover {
        background: #dc2626;
    }
    
    .select-button {
        width: 100%;
        padding: 0.5rem;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 0.75rem;
        cursor: pointer;
        text-align: center;
    }
    
    .select-button:hover:not(:disabled) {
        background: #f3f4f6;
        color: #374151;
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