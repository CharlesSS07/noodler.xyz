<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    // Custom number input node - no official blueprint
    export type NumberInputNodeType = Node<
        {
            value: number;
            min?: number;
            max?: number;
            step: number;
            label: string;
            output: { value: number };
        },
        'number-input'
    >;
</script>

<script lang="ts">
    import {
        Handle,
        Position,
        useSvelteFlow,
        type NodeProps
    } from '@xyflow/svelte';
    import { untrack } from 'svelte';
    import { getSocketDataTypeByName } from '../../lib/DataTypes';

    let { id, data }: NodeProps<NumberInputNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();

    // Initialize default values
    if (data.value === undefined) data.value = 0;
    if (data.step === undefined) data.step = 1;
    if (data.label === undefined) data.label = 'Number';

    let socketStyle = $state('');
    let inputRef: HTMLInputElement;
    let isFocused = $state(false);

    // Handle style loading
    getSocketDataTypeByName('number').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

    // Update output when value changes (use untrack to prevent infinite loops)
    $effect(() => {
        untrack(() => {
            updateNodeData(id, {
                output: { value: data.value }
            });
        });
    });

    function handleValueInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newValue = parseFloat(input.value);
        
        if (!isNaN(newValue)) {
            let clampedValue = newValue;
            
            // Apply min/max constraints if they exist
            if (data.min !== undefined) {
                clampedValue = Math.max(data.min, clampedValue);
            }
            if (data.max !== undefined) {
                clampedValue = Math.min(data.max, clampedValue);
            }
            
            updateNodeData(id, { value: clampedValue });
        }
    }

    function handleLabelInput(event: Event) {
        const input = event.target as HTMLInputElement;
        updateNodeData(id, { label: input.value });
    }

    function handleMinInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newMin = parseFloat(input.value);
        if (!isNaN(newMin)) {
            updateNodeData(id, { 
                min: newMin,
                value: data.max !== undefined ? Math.max(newMin, Math.min(data.max, data.value)) : Math.max(newMin, data.value)
            });
        } else {
            updateNodeData(id, { min: undefined });
        }
    }

    function handleMaxInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newMax = parseFloat(input.value);
        if (!isNaN(newMax)) {
            updateNodeData(id, { 
                max: newMax,
                value: data.min !== undefined ? Math.min(newMax, Math.max(data.min, data.value)) : Math.min(newMax, data.value)
            });
        } else {
            updateNodeData(id, { max: undefined });
        }
    }

    function handleStepInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newStep = parseFloat(input.value);
        if (!isNaN(newStep) && newStep > 0) {
            updateNodeData(id, { step: newStep });
        }
    }

    function increment() {
        let newValue = data.value + data.step;
        if (data.max !== undefined) {
            newValue = Math.min(data.max, newValue);
        }
        updateNodeData(id, { value: newValue });
    }

    function decrement() {
        let newValue = data.value - data.step;
        if (data.min !== undefined) {
            newValue = Math.max(data.min, newValue);
        }
        updateNodeData(id, { value: newValue });
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            increment();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            decrement();
        }
    }
</script>

<div class="number-input-node w-[180px] relative">
    <div class="bg-white border-2 border-gray-300 rounded-lg p-3">
        <!-- Label Input -->
        <div class="mb-2">
            <input 
                type="text" 
                value={data.label}
                on:input={handleLabelInput}
                class="w-full text-sm font-medium text-center border-none outline-none bg-transparent"
                placeholder="Label"
            />
        </div>

        <!-- Main Number Input -->
        <div class="number-input-container mb-3">
            <div class="flex items-center border border-gray-300 rounded {isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}">
                <button 
                    on:click={decrement}
                    class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={data.min !== undefined && data.value <= data.min}
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                </button>
                
                <input 
                    bind:this={inputRef}
                    type="number" 
                    value={data.value}
                    on:input={handleValueInput}
                    on:keydown={handleKeydown}
                    on:focus={() => isFocused = true}
                    on:blur={() => isFocused = false}
                    class="flex-1 text-center text-lg font-mono border-none outline-none py-2"
                    step={data.step}
                    min={data.min}
                    max={data.max}
                />
                
                <button 
                    on:click={increment}
                    class="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    disabled={data.max !== undefined && data.value >= data.max}
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Configuration Controls -->
        <div class="config-section space-y-2 text-xs">
            <div class="flex items-center space-x-2">
                <label class="text-gray-500 w-10">Min:</label>
                <input 
                    type="number" 
                    value={data.min ?? ''}
                    on:input={handleMinInput}
                    class="flex-1 border border-gray-300 rounded px-2 py-1"
                    placeholder="None"
                />
            </div>
            
            <div class="flex items-center space-x-2">
                <label class="text-gray-500 w-10">Max:</label>
                <input 
                    type="number" 
                    value={data.max ?? ''}
                    on:input={handleMaxInput}
                    class="flex-1 border border-gray-300 rounded px-2 py-1"
                    placeholder="None"
                />
            </div>
            
            <div class="flex items-center space-x-2">
                <label class="text-gray-500 w-10">Step:</label>
                <input 
                    type="number" 
                    value={data.step}
                    on:input={handleStepInput}
                    class="flex-1 border border-gray-300 rounded px-2 py-1"
                    min="0.001"
                    step="0.001"
                />
            </div>
        </div>

        <!-- Value Display -->
        <div class="mt-2 text-center">
            <div class="text-xs text-gray-500">Current Value</div>
            <div class="text-sm font-mono text-gray-700">{data.value}</div>
        </div>
    </div>

    <!-- Output Handle -->
    <Handle
        type="source"
        position={Position.Right}
        style="top:50%;{socketStyle}"
        id="output"
        class="socket-handle"
    />
</div>

<style>
    .number-input-node {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .socket-handle {
        width: 8px;
        height: 8px;
    }
    
    input[type="number"] {
        -moz-appearance: textfield;
    }
    
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    button:disabled:hover {
        background-color: transparent !important;
    }
</style>