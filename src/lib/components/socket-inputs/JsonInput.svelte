<script lang="ts">
    export let value: object | string = {};
    export let disabled: boolean = false;
    export let socketId: string = '';
    
    let jsonString: string = '';
    let isValid: boolean = true;
    let errorMessage: string = '';
    
    // Initialize JSON string from value
    $: {
        try {
            if (typeof value === 'string') {
                jsonString = value;
                // Try to parse to validate
                JSON.parse(value);
                isValid = true;
                errorMessage = '';
            } else {
                jsonString = JSON.stringify(value, null, 2);
                isValid = true;
                errorMessage = '';
            }
        } catch (error) {
            isValid = false;
            errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
        }
    }
    
    function handleInput(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        jsonString = textarea.value;
        
        try {
            // Try to parse the JSON
            const parsed = JSON.parse(jsonString);
            value = parsed;
            isValid = true;
            errorMessage = '';
        } catch (error) {
            isValid = false;
            errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
            // Still update the string value even if invalid
            value = jsonString;
        }
    }
    
    function formatJson() {
        if (isValid && jsonString) {
            try {
                const parsed = JSON.parse(jsonString);
                jsonString = JSON.stringify(parsed, null, 2);
            } catch (error) {
                // Do nothing if formatting fails
            }
        }
    }
</script>

<div class="json-input">
    <div class="json-header">
        <span class="json-label">JSON Object</span>
        {#if !disabled}
            <button 
                class="format-button"
                onclick={formatJson}
                disabled={!isValid}
                type="button"
            >
                Format
            </button>
        {/if}
    </div>
    
    <textarea
        value={jsonString}
        {disabled}
        oninput={handleInput}
        class="socket-input json-textarea"
        class:invalid={!isValid}
        rows="6"
        placeholder={'{"key": "value"}'}
        title="Socket: {socketId}"
    ></textarea>
    
    {#if !isValid && errorMessage}
        <div class="error-message">
            {errorMessage}
        </div>
    {/if}
    
    <div class="input-hints">
        <span class="hint">
            Status: {isValid ? 'Valid JSON' : 'Invalid JSON'}
        </span>
        <span class="hint">
            Characters: {jsonString.length}
        </span>
    </div>
</div>

<style>
    .json-input {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .json-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .json-label {
        font-size: 0.625rem;
        font-weight: 500;
        color: #374151;
    }
    
    .format-button {
        padding: 0.125rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        background: white;
        color: #374151;
        font-size: 0.625rem;
        cursor: pointer;
    }
    
    .format-button:hover:not(:disabled) {
        background: #f3f4f6;
    }
    
    .format-button:disabled {
        background: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
    }
    
    .json-textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        background: white;
        resize: vertical;
        min-height: 4rem;
    }
    
    .json-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }
    
    .json-textarea.invalid {
        border-color: #ef4444;
        background: #fef2f2;
    }
    
    .json-textarea.invalid:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 1px #ef4444;
    }
    
    .json-textarea:disabled {
        background: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
    }
    
    .error-message {
        padding: 0.25rem 0.5rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.25rem;
        color: #dc2626;
        font-size: 0.625rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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