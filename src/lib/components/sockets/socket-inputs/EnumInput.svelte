<script lang="ts">
    import type { ENUMSocketParams } from '$lib/compositor/SocketParamBuilders';
    
    export let value: string = '';
    export let params: ENUMSocketParams | undefined = undefined;
    export let disabled: boolean = false;
    export let socketId: string = '';
    
    // Extract options with default
    $: options = params?.options || ['Option 1', 'Option 2', 'Option 3'];
    
    // Ensure value is valid
    $: {
        if (value && !options.includes(value)) {
            value = options[0] || '';
        } else if (!value && options.length > 0) {
            value = options[0];
        }
    }
    
    function handleChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        value = select.value;
    }
</script>

<div class="enum-input">
    <select
        {value}
        {disabled}
        onchange={handleChange}
        class="socket-input enum-select"
        title="Socket: {socketId}"
    >
        {#each options as option}
            <option value={option} selected={option === value}>
                {option}
            </option>
        {/each}
    </select>
    
    {#if options.length > 0}
        <div class="input-hints">
            <span class="hint">{options.length} options available</span>
        </div>
    {/if}
</div>

<style>
    .enum-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .enum-select {
        width: 100%;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        background: white;
        cursor: pointer;
    }
    
    .enum-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }
    
    .enum-select:disabled {
        background: #f9fafb;
        color: #6b7280;
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