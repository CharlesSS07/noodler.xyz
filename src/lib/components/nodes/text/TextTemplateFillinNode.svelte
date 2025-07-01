<script lang="ts">
    import {
        type NodeProps,
        NodeResizeControl
    } from '@xyflow/svelte';
    import {createNodeStore, type NodeStoreType} from '$lib/components/nodes/NodeInstanceStore';
    import {STANDARD_DATATYPES} from '$lib/compositor/DataTypes';
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import NodeErrorDisplay from "$lib/components/nodeComponents/NodeErrorDisplay.svelte";
    import SourceSocketLabelled from "$lib/components/nodeComponents/sockets/SourceSocketLabelled.svelte";
    import TargetSocketLabelled from "$lib/components/nodeComponents/sockets/TargetSocketLabelled.svelte";

    let {id, selected}: NodeProps<NodeStoreType> = $props();

    const nodeStore = createNodeStore(id);
    let executionStatus = nodeStore.executionStatus;

    // State for template handling
    let isEditing: boolean = $state(false);
    let textareaRef: HTMLTextAreaElement;
    
    // Get template value directly from node input data
    const nodeInputData = nodeStore.nodeInputDataStore;
    let templateValue = $derived(($nodeInputData.template || '') as string);

    // Extract unique variables from template
    let templateVariables = $derived.by(() => {
        const matches = templateValue.match(/@(\w+)/g);
        if (!matches) return [];

        // Get unique variable names (remove @ prefix and dedupe)
        const uniqueVars = [...new Set(matches.map((match) => match.slice(1)))];
        return uniqueVars;
    });

    // Ensure input data has keys for all template variables
    $effect(() => {
        const variables = templateVariables;
        if (variables.length > 0) {
            const currentInput = $nodeInputData;
            const newInput = { ...currentInput };
            let hasChanges = false;

            // Add missing variable keys to input data
            variables.forEach(variable => {
                if (!(variable in newInput)) {
                    newInput[variable] = '';
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                nodeStore.updateData({ input: newInput });
            }
        }
    });

    $effect(() => {
        templateValue;
        if (textareaRef) autoResize(textareaRef);
    });

    // Handle click to edit
    function handleClick() {
        if (!isEditing) {
            isEditing = true;
            setTimeout(() => {
                if (textareaRef) {
                    textareaRef.focus();
                    textareaRef.setSelectionRange(textareaRef.value.length, textareaRef.value.length);
                    autoResize(textareaRef);
                }
            }, 0);
        }
    }

    // Handle escape key
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault();
            finishEditing();
        }
    }

    // Handle blur (defocus)
    function handleBlur() {
        finishEditing();
    }

    // Finish editing
    function finishEditing() {
        isEditing = false;
    }

    // Handle textarea input - update template and create sockets for new variables
    function handleInput(value: string) {
        nodeStore.updateDataInputSocket('template', value);
        if (textareaRef) autoResize(textareaRef);
    }

    // Auto-resize textarea based on scrollHeight, with a minimum height
    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.height = 'auto';
        const minHeightBasedOnRows = 3 * 20;
        textarea.style.height = Math.max(minHeightBasedOnRows, textarea.scrollHeight) + 'px';
    }

    // Get all variable socket stores for checking connections
    const allSocketsStore = nodeStore.allInputSocketsStore();

    // Highlight variables in display text
    function highlightVariables(text: string): string {
        return text.replace(/@(\w+)/g, (match, varName) => {
            // Check if this variable has a connected socket
            const socketMap = $allSocketsStore;
            const hasValue = socketMap && socketMap.has(varName) && socketMap.get(varName)?.isConnected;
            const className = hasValue ? 'variable-filled' : 'variable-empty';
            return `<span class="${className}">${match}</span>`;
        });
    }
</script>

<NodeWrapper
        label="Template"
        documentation="Fill in your text with variables from links. Useful for prompt design."
        isSelected={selected}
        executionStatus={$executionStatus}
>
    <div class="flex flex-col border-2 border-gray-300 rounded-lg bg-white relative">

        <!-- Output socket -->
        <SourceSocketLabelled
            id="text"
            label="Filled in Template Text"
            datatype={STANDARD_DATATYPES.TEXT}
            documentation="Filled template output"
        />

        <div class="p-3">
            {#if isEditing}
                <textarea
                        bind:this={textareaRef}
                        value={templateValue}
                        onblur={handleBlur}
                        onkeydown={handleKeydown}
                        oninput={(e) => handleInput(e.target.value)}
                        class="w-full border-0 outline-none resize-y font-mono text-sm"
                        placeholder="Enter template with @variable placeholders..."
                        rows="3"
                        style="min-height: 60px;"
                ></textarea>
            {:else}
                <div
                        class="min-h-[60px] overflow-auto cursor-pointer hover:bg-gray-50 transition-colors"
                        onclick={handleClick}
                        role="button"
                        tabindex="0"
                        onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleClick();
                            }
                        }}
                >
                    {#if templateValue && templateValue.trim()}
                        <div class="template-display font-mono text-sm whitespace-pre-wrap">
                            {@html highlightVariables(templateValue)}
                        </div>
                    {:else}
                        <div class="text-gray-400 text-center flex flex-col items-center justify-center h-full">
                            <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span class="text-sm">Click to edit template</span>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>



        <!-- Dynamic variable sockets -->
        <div class="flex flex-col">
            {#each templateVariables as variable, index}
                <TargetSocketLabelled
                        id={variable}
                        label={variable}
                        datatype={STANDARD_DATATYPES.TEXT}
                        documentation="Fills in @{variable}"
                />
            {/each}
        </div>

        {#if $executionStatus}
            <NodeErrorDisplay errorMessage={$executionStatus.logs.map((log) => log[1]).join('<br>')}></NodeErrorDisplay>
        {/if}

    </div>



</NodeWrapper>

<style>
    .template-display :global(.variable-filled) {
        background-color: #dcfce7;
        color: #166534;
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: 500;
    }

    .template-display :global(.variable-empty) {
        background-color: #fef2f2;
        color: #dc2626;
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: 500;
        border: 1px dashed #fca5a5;
    }
</style>