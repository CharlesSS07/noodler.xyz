<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    // Custom knob input node - no official blueprint
    export type KnobNodeType = Node<
        {
            value: number;
            min: number;
            max: number;
            step: number;
            output: { value: number };
        },
        'knob-input'
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

    let { id, data }: NodeProps<KnobNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();

    // Initialize default values
    if (data.value === undefined) data.value = 50;
    if (data.min === undefined) data.min = 0;
    if (data.max === undefined) data.max = 100;
    if (data.step === undefined) data.step = 1;

    let socketStyle = $state('');
    let isDragging = $state(false);
    let knobRef: SVGElement;

    // Handle style loading
    getSocketDataTypeByName('number').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

    // Computed values
    let normalizedValue = $derived((data.value - data.min) / (data.max - data.min));
    let angle = $derived(normalizedValue * 270 - 135); // -135° to +135° (270° total range)
    let displayValue = $derived(Math.round(data.value * 100) / 100); // Round to 2 decimal places
    
    // Indicator position calculations
    let indicatorRadians = $derived((angle * Math.PI) / 180);
    let indicatorX = $derived(40 + 18 * Math.cos(indicatorRadians));
    let indicatorY = $derived(40 + 18 * Math.sin(indicatorRadians));

    // Update output when value changes (use untrack to prevent infinite loops)
    $effect(() => {
        untrack(() => {
            updateNodeData(id, {
                output: { value: data.value }
            });
        });
    });

    function handleMouseDown(event: MouseEvent) {
        isDragging = true;
        event.preventDefault();
        
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging || !knobRef) return;
            
            const rect = knobRef.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calculate angle from center to mouse position
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            let mouseAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            
            // Convert to knob angle range (-135° to +135°)
            mouseAngle = mouseAngle + 90; // Offset so 0° is at top
            if (mouseAngle < -135) mouseAngle += 360;
            if (mouseAngle > 225) mouseAngle -= 360;
            
            // Clamp to valid range
            mouseAngle = Math.max(-135, Math.min(135, mouseAngle));
            
            // Convert angle to value
            const normalizedAngle = (mouseAngle + 135) / 270;
            const newValue = data.min + normalizedAngle * (data.max - data.min);
            const steppedValue = Math.round(newValue / data.step) * data.step;
            const clampedValue = Math.max(data.min, Math.min(data.max, steppedValue));
            
            updateNodeData(id, { value: clampedValue });
        };
        
        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function handleWheel(event: WheelEvent) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -data.step : data.step;
        const newValue = Math.max(data.min, Math.min(data.max, data.value + delta));
        updateNodeData(id, { value: newValue });
    }

    function handleValueInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newValue = parseFloat(input.value);
        if (!isNaN(newValue)) {
            const clampedValue = Math.max(data.min, Math.min(data.max, newValue));
            updateNodeData(id, { value: clampedValue });
        }
    }

    function handleMinInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newMin = parseFloat(input.value);
        if (!isNaN(newMin) && newMin < data.max) {
            updateNodeData(id, { 
                min: newMin,
                value: Math.max(newMin, data.value)
            });
        }
    }

    function handleMaxInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newMax = parseFloat(input.value);
        if (!isNaN(newMax) && newMax > data.min) {
            updateNodeData(id, { 
                max: newMax,
                value: Math.min(newMax, data.value)
            });
        }
    }

    function handleStepInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const newStep = parseFloat(input.value);
        if (!isNaN(newStep) && newStep > 0) {
            updateNodeData(id, { step: newStep });
        }
    }
</script>

<div class="knob-node w-[200px] relative">
    <!-- Knob Container -->
    <div class="knob-container bg-white border-2 border-gray-300 rounded-lg p-4">
        <!-- Value Display -->
        <div class="text-center mb-2">
            <div class="text-xs text-gray-500 mb-1">Value</div>
            <input 
                type="number" 
                value={displayValue}
                on:input={handleValueInput}
                class="w-16 text-center text-sm border border-gray-300 rounded px-1"
                step={data.step}
                min={data.min}
                max={data.max}
            />
        </div>

        <!-- Analog Knob -->
        <div class="knob-wrapper flex justify-center mb-3">
            <svg 
                bind:this={knobRef}
                width="80" 
                height="80" 
                viewBox="0 0 80 80"
                class="cursor-pointer select-none"
                on:mousedown={handleMouseDown}
                on:wheel={handleWheel}
            >
                <!-- Outer ring -->
                <circle 
                    cx="40" 
                    cy="40" 
                    r="35" 
                    fill="none" 
                    stroke="#e5e7eb" 
                    stroke-width="2"
                />
                
                <!-- Tick marks -->
                {#each Array(9) as _, i}
                    {@const tickAngle = -135 + (i * 33.75)}
                    {@const tickRadians = (tickAngle * Math.PI) / 180}
                    {@const x1 = 40 + 30 * Math.cos(tickRadians)}
                    {@const y1 = 40 + 30 * Math.sin(tickRadians)}
                    {@const x2 = 40 + 33 * Math.cos(tickRadians)}
                    {@const y2 = 40 + 33 * Math.sin(tickRadians)}
                    <line 
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke="#9ca3af" 
                        stroke-width="1"
                    />
                {/each}

                <!-- Knob body -->
                <circle 
                    cx="40" 
                    cy="40" 
                    r="25" 
                    fill={isDragging ? "#3b82f6" : "#6b7280"}
                    stroke="#374151" 
                    stroke-width="2"
                    class="transition-colors duration-150"
                />
                
                <!-- Knob indicator -->
                <circle 
                    cx={indicatorX} 
                    cy={indicatorY} 
                    r="3" 
                    fill="white"
                />
                
                <!-- Center dot -->
                <circle 
                    cx="40" 
                    cy="40" 
                    r="2" 
                    fill="#374151"
                />
            </svg>
        </div>

        <!-- Range Controls -->
        <div class="range-controls space-y-2">
            <div class="flex items-center space-x-2">
                <label class="text-xs text-gray-500 w-8">Min:</label>
                <input 
                    type="number" 
                    value={data.min}
                    on:input={handleMinInput}
                    class="flex-1 text-xs border border-gray-300 rounded px-1"
                />
            </div>
            <div class="flex items-center space-x-2">
                <label class="text-xs text-gray-500 w-8">Max:</label>
                <input 
                    type="number" 
                    value={data.max}
                    on:input={handleMaxInput}
                    class="flex-1 text-xs border border-gray-300 rounded px-1"
                />
            </div>
            <div class="flex items-center space-x-2">
                <label class="text-xs text-gray-500 w-8">Step:</label>
                <input 
                    type="number" 
                    value={data.step}
                    on:input={handleStepInput}
                    class="flex-1 text-xs border border-gray-300 rounded px-1"
                    min="0.01"
                    step="0.01"
                />
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
    .knob-node {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .socket-handle {
        width: 8px;
        height: 8px;
    }
    
    .knob-wrapper svg {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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