<script lang="ts">
    import type { StringSocketParams } from '$lib/compositor/SocketParamBuilders';
    
    export let value: string = '';
    export let params: StringSocketParams | undefined = undefined;
    export let disabled: boolean = false;
    export let socketId: string = '';
    
    // Extract parameters with defaults
    $: isSensitive = params?.isSensitive ?? false;
    $: minCharacters = params?.minCharacters ?? undefined;
    $: maxCharacters = params?.maxCharacters ?? undefined;
    $: numRows = params?.numRows ?? 1;
    
    // Determine if we should use textarea or input
    $: useTextarea = numRows > 1 || (minCharacters && minCharacters > 50);
    
    function handleInput(event: Event) {
        const input = event.target as HTMLInputElement | HTMLTextAreaElement;
        value = input.value;
    }
</script>

<div class="string-input">
    {#if useTextarea}
        <textarea
            {value}
            {disabled}
            oninput={handleInput}
            class="socket-input string-textarea"
            rows={numRows || 3}
            placeholder="Enter text..."
            title="Socket: {socketId}"
            maxlength={maxCharacters || undefined}
        ></textarea>
    {:else}
        <input
            type={isSensitive ? 'password' : 'text'}
            {value}
            {disabled}
            oninput={handleInput}
            class="socket-input string-input-field"
            placeholder={isSensitive ? 'Enter password...' : 'Enter text...'}
            title="Socket: {socketId}"
            maxlength={maxCharacters || undefined}
        />
    {/if}
    
    {#if params && (minCharacters || maxCharacters)}
        <div class="input-hints">
            {#if minCharacters && maxCharacters}
                <span class="hint">Length: {minCharacters}-{maxCharacters} chars</span>
            {:else if minCharacters}
                <span class="hint">Min: {minCharacters} chars</span>
            {:else if maxCharacters}
                <span class="hint">Max: {maxCharacters} chars</span>
            {/if}
            <span class="hint">Current: {value.length}</span>
        </div>
    {/if}
</div>

<style>
    .string-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .string-input-field,
    .string-textarea {
        width: 100%;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        background: white;
        font-family: inherit;
        resize: vertical;
    }
    
    .string-input-field:focus,
    .string-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }
    
    .string-input-field:disabled,
    .string-textarea:disabled {
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