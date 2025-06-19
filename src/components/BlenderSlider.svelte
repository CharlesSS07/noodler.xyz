<script>
    let { value = $bindable(), min = 0, max = 100, step = 1 } = $props();
    
    // Create a local reactive value that syncs with the bindable prop
    let localValue = $state(value);

    let isEditing = false;
    let sliderElement;
    let inputElement;
    let editValue = '';

    // Sync localValue with value prop changes
    $effect(() => {
        localValue = value;
    });
    
    // Sync value prop with localValue changes
    $effect(() => {
        value = localValue;
    });

    // Calculate the percentage for the gradient
    let percentage = $derived((localValue - min) / (max - min) * 100);

    function handleMouseDown(e) {
        // Stop event from bubbling to node
        e.preventDefault();
        e.stopPropagation();
        
        // Add document listeners for dragging
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Also handle the initial position
        handleMouseMove(e);
    }

    function handleMouseMove(e) {
        if (sliderElement) {
            const rect = sliderElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            const newValue = min + (newPercentage / 100) * (max - min);

            // Round to nearest step
            const steppedValue = Math.round(newValue / step) * step;

            // Ensure value stays within bounds
            const newBoundedValue = Math.max(min, Math.min(max, steppedValue));
            localValue = newBoundedValue;
        }
    }

    function handleMouseUp() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    function handleDoubleClick(e) {
        // Stop event from bubbling to node
        e.stopPropagation();
        startEditing();
    }

    function startEditing() {
        isEditing = true;
        editValue = localValue.toString();

        // Focus the input after it's rendered
        setTimeout(() => {
            if (inputElement) {
                inputElement.focus();
                inputElement.select();
            }
        }, 0);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            finishEditing();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    }

    function finishEditing() {
        const newValue = parseFloat(editValue);
        if (!isNaN(newValue)) {
            localValue = Math.max(min, Math.min(max, Math.round(newValue / step) * step));
        }
        isEditing = false;
    }

    function cancelEditing() {
        isEditing = false;
        editValue = '';
    }

    function handleBlur() {
        finishEditing();
    }
</script>

<div class="p-6 mx-auto space-y-6 w-full" style="width: 100%; margin: 0 0;padding: 0 0;">
    <div>

        <div class="relative">
            {#if isEditing}
                <input
                        bind:this={inputElement}
                        bind:value={editValue}
                        on:keydown={handleKeyDown}
                        on:blur={handleBlur}
                        type="number"
                        {min}
                        {max}
                        {step}
                        class="w-full h-8 px-3 text-sm border border-blue-400 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            {:else}
                <div
                        bind:this={sliderElement}
                        on:mousedown={handleMouseDown}
                        on:dblclick={handleDoubleClick}
                        class="relative w-full h-8 rounded-full cursor-pointer select-none overflow-hidden border border-gray-300 bg-gray-100"
                        style="background: linear-gradient(to right, #3b82f6 0%, #3b82f6 {percentage}%, #e5e7eb {percentage}%, #e5e7eb 100%)"
                >
                    <!-- Value display -->
                    <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-sm font-medium text-white mix-blend-difference">
              {localValue.toFixed(2)}
            </span>
                    </div>
                </div>
            {/if}
        </div>

        <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{min}</span>
            <span>{max}</span>
        </div>
    </div>
</div>