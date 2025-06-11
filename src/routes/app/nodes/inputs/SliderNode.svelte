<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    // Custom slider input node (0-1 range) - no official blueprint
    export type SliderNodeType = Node<
        {
            value: number;
            label: string;
            precision: number;
            output: { value: number };
        },
        'slider-input'
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

    let { id, data }: NodeProps<SliderNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();

    // Initialize default values
    if (data.value === undefined) data.value = 0.5;
    if (data.label === undefined) data.label = 'Slider';
    if (data.precision === undefined) data.precision = 2;

    let socketStyle = $state('');
    let sliderRef: HTMLInputElement;
    let isDragging = $state(false);

    // Handle style loading
    getSocketDataTypeByName('number').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

    // Ensure value is always between 0 and 1
    let clampedValue = $derived(Math.max(0, Math.min(1, data.value)));
    let displayValue = $derived(Number(clampedValue.toFixed(data.precision)));
    let percentage = $derived(clampedValue * 100);

    // Update output when value changes (use untrack to prevent infinite loops)
    $effect(() => {
        untrack(() => {
            updateNodeData(id, {
                output: { value: clampedValue }
            });
        });
    });

    function handleSliderInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newValue = parseFloat(input.value);
        updateNodeData(id, { value: newValue });
    }

    function handleValueInput(event: Event) {
        const input = event.target as HTMLInputElement;
        let newValue = parseFloat(input.value);
        
        if (!isNaN(newValue)) {
            // Clamp to 0-1 range
            newValue = Math.max(0, Math.min(1, newValue));
            updateNodeData(id, { value: newValue });
        }
    }

    function handleLabelInput(event: Event) {
        const input = event.target as HTMLInputElement;
        updateNodeData(id, { label: input.value });
    }

    function handlePrecisionInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newPrecision = parseInt(input.value);
        if (!isNaN(newPrecision) && newPrecision >= 0 && newPrecision <= 6) {
            updateNodeData(id, { precision: newPrecision });
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        const step = 0.01;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault();
            const newValue = Math.min(1, data.value + step);
            updateNodeData(id, { value: newValue });
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault();
            const newValue = Math.max(0, data.value - step);
            updateNodeData(id, { value: newValue });
        }
    }

    function setPresetValue(value: number) {
        updateNodeData(id, { value });
    }
</script>

<div class="slider-node w-[200px] relative">
    <div class="bg-white border-2 border-gray-300 rounded-lg p-3">
        <!-- Label Input -->
        <div class="mb-3">
            <input 
                type="text" 
                value={data.label}
                on:input={handleLabelInput}
                class="w-full text-sm font-medium text-center border-none outline-none bg-transparent"
                placeholder="Label"
            />
        </div>

        <!-- Value Display -->
        <div class="value-display mb-3 text-center">
            <input 
                type="number" 
                value={displayValue}
                on:input={handleValueInput}
                class="w-20 text-lg font-mono text-center border border-gray-300 rounded px-2 py-1"
                step={Math.pow(10, -data.precision)}
                min="0"
                max="1"
            />
            <div class="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
        </div>

        <!-- Main Slider -->
        <div class="slider-container mb-3">
            <div class="relative">
                <input
                    bind:this={sliderRef}
                    type="range"
                    min="0"
                    max="1"
                    step={Math.pow(10, -data.precision)}
                    value={clampedValue}
                    on:input={handleSliderInput}
                    on:keydown={handleKeydown}
                    on:mousedown={() => isDragging = true}
                    on:mouseup={() => isDragging = false}
                    class="slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                
                <!-- Custom slider track fill -->
                <div 
                    class="slider-fill absolute top-0 left-0 h-2 bg-blue-500 rounded-lg pointer-events-none transition-all duration-75"
                    style="width: {percentage}%"
                ></div>
                
                <!-- Custom slider thumb -->
                <div 
                    class="slider-thumb absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full pointer-events-none transition-all duration-75 {isDragging ? 'scale-110 shadow-lg' : 'shadow-md'}"
                    style="left: {percentage}%"
                ></div>
            </div>
            
            <!-- Range indicators -->
            <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>0.5</span>
                <span>1</span>
            </div>
        </div>

        <!-- Preset Buttons -->
        <div class="preset-buttons mb-3">
            <div class="text-xs text-gray-500 mb-1">Quick Values:</div>
            <div class="flex space-x-1">
                {#each [0, 0.25, 0.5, 0.75, 1] as preset}
                    <button
                        on:click={() => setPresetValue(preset)}
                        class="flex-1 text-xs py-1 px-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors {Math.abs(clampedValue - preset) < 0.001 ? 'bg-blue-100 border-blue-300' : ''}"
                    >
                        {preset}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Configuration -->
        <div class="config-section">
            <div class="flex items-center space-x-2 text-xs">
                <label class="text-gray-500 w-16">Precision:</label>
                <select 
                    value={data.precision}
                    on:change={handlePrecisionInput}
                    class="flex-1 border border-gray-300 rounded px-1 py-1"
                >
                    {#each [0, 1, 2, 3, 4, 5, 6] as precision}
                        <option value={precision}>{precision} decimal{precision !== 1 ? 's' : ''}</option>
                    {/each}
                </select>
            </div>
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
    .slider-node {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .socket-handle {
        width: 8px;
        height: 8px;
    }
    
    .slider-container {
        position: relative;
    }
    
    .slider {
        -webkit-appearance: none;
        background: transparent;
        outline: none;
    }
    
    .slider::-webkit-slider-track {
        background: transparent;
        height: 8px;
        border-radius: 4px;
    }
    
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        background: transparent;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        cursor: pointer;
    }
    
    .slider::-moz-range-track {
        background: transparent;
        height: 8px;
        border-radius: 4px;
        border: none;
    }
    
    .slider::-moz-range-thumb {
        background: transparent;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }
    
    input[type="number"] {
        -moz-appearance: textfield;
    }
    
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>