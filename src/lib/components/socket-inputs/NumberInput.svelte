<script lang="ts">
    import type { NumberSocketParams } from '$lib/compositor/SocketParamBuilders';
    import BlenderSlider from "$lib/components/socket-inputs/BlenderSlider.svelte";

    let { 
        value = $bindable(0), 
        params = undefined, 
        disabled = false, 
        socketId = '' 
    }: {
        value: number;
        params?: NumberSocketParams;
        disabled?: boolean;
        socketId?: string;
    } = $props();
    
    // Extract parameters with defaults
    let min = $derived(params?.min ?? undefined);
    let max = $derived(params?.max ?? undefined);
    let step = $derived(params?.step ?? 1);
    
    function handleInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newValue = parseFloat(input.value);
        if (!isNaN(newValue)) {
            if (min && min > newValue) {
                value = min;
                return;
            }
            if (max && max < newValue) {
                value = max;
                return;
            }
            value = newValue;
        }
    }
</script>

<div class="number-input">
    {#if (min!==undefined && max!==undefined)}
<!--        <Label for="range-slider" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">-->
<!--            Select Value: {value}-->
<!--        </Label>-->

<!--        <Range-->
<!--                id="range-slider"-->
<!--                bind:value={value}-->
<!--                {min}-->
<!--                {max}-->
<!--                {step}-->
<!--                class="mb-4"-->
<!--        />-->
<!--        <div class="flex justify-between text-xs text-gray-500">-->
<!--            <span>{min}</span>-->
<!--            <span>{max}</span>-->
<!--        </div>-->
        <BlenderSlider {value} {min} {max} {step}></BlenderSlider>
<!--        <input-->
<!--                type="number"-->
<!--                bind:value={value}-->
<!--                {min}-->
<!--                {max}-->
<!--                {step}-->
<!--                {disabled}-->
<!--                oninput={handleInput}-->
<!--                class="socket-input number-input-field"-->
<!--                style="width: 10%"-->
<!--                placeholder="Enter number..."-->
<!--                title="Socket: {socketId}"-->
<!--        />-->
<!--        <input-->
<!--            type="range"-->
<!--            bind:value={value}-->
<!--            {min}-->
<!--            {max}-->
<!--            {step}-->
<!--            {disabled}-->
<!--            oninput={handleInput}-->
<!--            class="socket-input number-input-field"-->
<!--            placeholder="Enter number..."-->
<!--            title="Socket: {socketId}"-->
<!--        />-->
    {:else}
        <input
                type="number"
                bind:value={value}
                {min}
                {max}
                {step}
                {disabled}
                oninput={handleInput}
                class="socket-input number-input-field"
                placeholder="Enter number..."
                title="Socket: {socketId}"
        />
    {/if}
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