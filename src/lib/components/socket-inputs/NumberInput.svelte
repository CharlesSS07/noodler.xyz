<script lang="ts">
    import type { NumberSocketParams } from '../../../routes/app/lib/SocketParamBuilders';
    
    export let value: number = 0;
    export let params: NumberSocketParams | undefined = undefined;
    export let disabled: boolean = false;
    export let socketId: string = '';
    
    // Extract parameters with defaults
    $: min = params?.min ?? undefined;
    $: max = params?.max ?? undefined;
    $: step = params?.step ?? 1;
    
    function handleInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newValue = parseFloat(input.value);
        if (!isNaN(newValue)) {
            value = newValue;
        }
    }
</script>

<div class="number-input">
    <input
        type="number"
        {value}
        {min}
        {max}
        {step}
        {disabled}
        oninput={handleInput}
        class="socket-input number-input-field"
        placeholder="Enter number..."
        title="Socket: {socketId}"
    />
    {#if params}
        <div class="input-hints">
            {#if min !== undefined && max !== undefined}
                <span class="hint">Range: {min} - {max}</span>
            {:else if min !== undefined}
                <span class="hint">Min: {min}</span>
            {:else if max !== undefined}
                <span class="hint">Max: {max}</span>
            {/if}
        </div>
    {/if}
</div>

<style>
    .number-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .number-input-field {
        width: 100%;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        background: white;
    }
    
    .number-input-field:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }
    
    .number-input-field:disabled {
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