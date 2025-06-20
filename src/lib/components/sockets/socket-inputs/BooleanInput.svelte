<script lang="ts">
    export let value: boolean = false;
    export let disabled: boolean = false;
    export let socketId: string = '';
    export let label: string = '';
    
    function handleChange(event: Event) {
        const input = event.target as HTMLInputElement;
        value = input.checked;
    }
</script>

<div class="boolean-input">
    <label class="checkbox-label">
        <input
            type="checkbox"
            checked={value}
            {disabled}
            onchange={handleChange}
            class="socket-input checkbox-input"
            title="Socket: {socketId}"
        />
        <span class="checkbox-text">
            {label || (value ? 'True' : 'False')}
        </span>
    </label>
</div>

<style>
    .boolean-input {
        display: flex;
        align-items: center;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.75rem;
        color: #374151;
    }
    
    .checkbox-label:has(.checkbox-input:disabled) {
        cursor: not-allowed;
        color: #6b7280;
    }
    
    .checkbox-input {
        width: 1rem;
        height: 1rem;
        accent-color: #3b82f6;
    }
    
    .checkbox-input:disabled {
        cursor: not-allowed;
    }
    
    .checkbox-text {
        font-weight: 500;
    }
</style>